import mongoose from "mongoose";
import queueModel from "../models/queueModel.js";
import Ticket from "../models/ticketModel.js";
import { emitQueueUpdated, emitTicketCalled, emitTicketDone } from "./eventService.js";
import { AppError } from "../helpers/AppError.js";

// ─── READ OPERATIONS ──────────────────────────────────────────────

export const getQueuesForClinic = async (clinicId) => {
  const queues = await queueModel.find({ clinicId, isActive: true }).lean();

  // Aggregate waiting counts in one query
  const queueStats = await Ticket.aggregate([
    {
      $match: { queueId: { $in: queues.map((q) => q._id) }, status: "waiting" },
    },
    {
      $group: { _id: "$queueId", waitingCount: { $sum: 1 } },
    },
  ]);

  const statsMap = new Map(
    queueStats.map((s) => [s._id.toString(), s.waitingCount]),
  );

  const mergedQueues = queues.map((q) => {
    const waitingCount = statsMap.get(q._id.toString()) || 0;
    return {
      ...q,
      waitingCount,
      estimatedWaitTime: waitingCount * (q.avgServiceTime || 0),
    };
  });

  return mergedQueues;
};

export const getTicketsForQueue = async (clinicId, queueId) => {
  const tickets = await Ticket.find({
    clinicId,
    queueId,
    status: { $in: ["waiting", "called"] },
  })
    .sort({ number: 1 })
    .lean();

  const calledTicket = tickets.find((t) => t.status === "called") || null;
  const nextTicket = tickets.find((t) => t.status === "waiting") || null;

  return {
    tickets,
    calledTicket,
    nextTicket,
    waitingCount: tickets.filter((t) => t.status === "waiting").length,
    totalTickets: tickets.length,
  };
};

// ─── WRITE OPERATIONS ─────────────────────────────────────────────

export const callNextTicket = async (clinicId, queueId) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      // 1. Singleton Active Rule: only ONE called ticket per queue
      const alreadyCalled = await Ticket.findOne({
        clinicId,
        queueId,
        status: "called",
      }).session(session);

      if (alreadyCalled) {
        throw new AppError("A ticket is already being served", 409);
      }

      // 2. Atomic FIFO select: find lowest waiting number
      const nextTicket = await Ticket.findOneAndUpdate(
        { queueId, clinicId, status: "waiting" },
        { $set: { status: "called", calledAt: new Date() } },
        { sort: { number: 1 }, new: true, session },
      );

      if (!nextTicket) {
        throw new AppError("No waiting tickets in this queue", 404);
      }

      result = nextTicket;
    });

    // 3. Post-Commit: events fire ONLY after DB commit succeeds
    const waitingCount = await Ticket.countDocuments({
      queueId,
      clinicId,
      status: "waiting",
    });

    emitTicketCalled(clinicId, {
      ticketId: result._id,
      number: result.number,
      queueId,
      clinicId,
      calledAt: result.calledAt,
    });

    emitQueueUpdated(clinicId, {
      queueId,
      clinicId,
      waitingCount,
      currentlyServing: result.number,
    });

    return result;
  } finally {
    session.endSession();
  }
};

export const callSpecificTicket = async (clinicId, queueId, ticketId) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      // 1. Singleton Rule: one called ticket only
      const alreadyCalled = await Ticket.findOne({
        clinicId,
        queueId,
        status: "called",
      }).session(session);

      if (alreadyCalled) {
        throw new AppError("Another ticket is already being served", 409);
      }

      // 2. Atomic: validate + update in one query (no race condition window)
      const targetTicket = await Ticket.findOneAndUpdate(
        { _id: ticketId, queueId, clinicId, status: "waiting" },
        { $set: { status: "called", calledAt: new Date() } },
        { new: true, session },
      );

      if (!targetTicket) {
        throw new AppError("Requested ticket not found or not waiting", 404);
      }

      result = targetTicket;
    });

    // 3. Post-Commit Events
    const waitingCount = await Ticket.countDocuments({
      queueId,
      clinicId,
      status: "waiting",
    });

    emitTicketCalled(clinicId, {
      ticketId: result._id,
      number: result.number,
      queueId,
      clinicId,
      calledAt: result.calledAt,
    });

    emitQueueUpdated(clinicId, {
      queueId,
      clinicId,
      waitingCount,
      currentlyServing: result.number,
    });

    return result;
  } finally {
    session.endSession();
  }
};

export const markTicketDone = async (clinicId, ticketId) => {
  const session = await mongoose.startSession();
  let doneTicket = null;
  let updatedQueue = null;

  try {
    await session.withTransaction(async () => {
      // 1. Mark ticket as done (keep calledAt for analytics!)
      const ticket = await Ticket.findOneAndUpdate(
        { _id: ticketId, clinicId, status: "called" },
        { $set: { status: "done", completedAt: new Date() } },
        { new: true, session },
      );

      if (!ticket) {
        throw new AppError("Ticket not found or not currently served", 404);
      }

      // 2. Safety check: calledAt must exist for valid calculation
      if (!ticket.calledAt) {
        throw new AppError("Ticket has corrupted data: missing calledAt", 500);
      }

      // 3. Rolling average: O(1) calculation (unit: minutes)
      const serviceTimeMin = (ticket.completedAt - ticket.calledAt) / 60000;

      const currentQueue = await queueModel
        .findById(ticket.queueId)
        .session(session);

      const oldCount = currentQueue.totalServedCount;
      const oldAvg = currentQueue.avgServiceTime;
      const newAvg = (oldAvg * oldCount + serviceTimeMin) / (oldCount + 1);

      updatedQueue = await queueModel.findOneAndUpdate(
        { _id: ticket.queueId },
        {
          $inc: { totalServedCount: 1 },
          $set: { avgServiceTime: Math.round(newAvg * 100) / 100 },
        },
        { new: true, session },
      );

      doneTicket = ticket;
    });

    // 4. Post-Commit Events
    const waitingCount = await Ticket.countDocuments({
      queueId: doneTicket.queueId,
      clinicId,
      status: "waiting",
    });

    emitTicketDone(clinicId, {
      ticketId: doneTicket._id,
      number: doneTicket.number,
      queueId: doneTicket.queueId,
      clinicId,
      completedAt: doneTicket.completedAt,
    });

    emitQueueUpdated(clinicId, {
      queueId: doneTicket.queueId,
      clinicId,
      waitingCount,
      currentlyServing: null,
      avgServiceTime: updatedQueue.avgServiceTime,
    });

    return doneTicket;
  } finally {
    session.endSession();
  }
};

export const skipTicket = async (clinicId, queueId, ticketId) => {
  const session = await mongoose.startSession();
  let skippedTicket = null;

  try {
    await session.withTransaction(async () => {
      // 1. Verify ticket is waiting (cannot skip a called ticket)
      const ticket = await Ticket.findOne({
        _id: ticketId,
        queueId,
        clinicId,
        status: "waiting",
      }).session(session);

      if (!ticket) {
        throw new AppError("Ticket not found or not in waiting state", 404);
      }

      // 2. Atomic counter: get a new number at the end of the line
      const updatedQueue = await queueModel.findOneAndUpdate(
        { _id: queueId, clinicId },
        { $inc: { currentNumber: 1 } },
        { new: true, session },
      );

      // 3. Re-number the ticket to the end
      ticket.number = updatedQueue.currentNumber;
      await ticket.save({ session });

      skippedTicket = ticket;
    });

    // 4. Post-Commit Events
    const waitingCount = await Ticket.countDocuments({
      queueId,
      clinicId,
      status: "waiting",
    });

    emitQueueUpdated(clinicId, {
      queueId,
      clinicId,
      waitingCount,
      currentlyServing: null,
    });

    return skippedTicket;
  } finally {
    session.endSession();
  }
};

export const recallTicket = async (clinicId, ticketId) => {
  // 1. Verify ticket is currently called (no DB mutation)
  const ticket = await Ticket.findOne({
    _id: ticketId,
    clinicId,
    status: "called",
  }).lean();

  if (!ticket) {
    throw new AppError("Ticket not found or not currently called", 404);
  }

  // 2. Re-emit the event (UX only — patient didn't hear the first call)
  emitTicketCalled(clinicId, {
    ticketId: ticket._id,
    number: ticket.number,
    queueId: ticket.queueId,
    clinicId,
    calledAt: ticket.calledAt,
    isRecall: true,
  });

  return ticket;
};

// ─── STATS ────────────────────────────────────────────────────────

export const getQueueStats = async (clinicId, queueId) => {
  const queue = await queueModel
    .findOne({ _id: queueId, clinicId })
    .select("name avgServiceTime totalServedCount currentNumber")
    .lean();

  if (!queue) {
    throw new AppError("Queue not found", 404);
  }

  // Today's boundary (midnight)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [waitingCount, servedToday] = await Promise.all([
    Ticket.countDocuments({ queueId, clinicId, status: "waiting" }),
    Ticket.countDocuments({
      queueId,
      clinicId,
      status: "done",
      completedAt: { $gte: todayStart },
    }),
  ]);

  const calledTicket = await Ticket.findOne({
    queueId,
    clinicId,
    status: "called",
  })
    .select("number calledAt")
    .lean();

  return {
    ...queue,
    waitingCount,
    servedToday,
    currentlyServing: calledTicket?.number ?? null,
    estimatedWaitTime: waitingCount * (queue.avgServiceTime || 0),
  };
};
