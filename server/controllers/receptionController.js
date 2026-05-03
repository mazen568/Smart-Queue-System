import * as receptionService from "../services/receptionService.js";
import Ticket from "../models/ticketModel.js";
import { emitTicketCalled } from "../config/socket.config.js";

// ─── READ ─────────────────────────────────────────────────────────

// GET /reception/queues
export const getQueues = async (req, res) => {
  const data = await receptionService.getQueuesForClinic(req.user.clinicId);

  res.status(200).json({
    success: true,
    message: "Queues fetched successfully",
    data,
  });
};

// GET /reception/queues/:queueId/tickets
export const getTickets = async (req, res) => {
  const data = await receptionService.getTicketsForQueue(
    req.user.clinicId,
    req.params.queueId,
  );

  res.status(200).json({
    success: true,
    message: "Tickets fetched successfully",
    data,
  });
};

// GET /reception/queues/:queueId/stats
export const getStats = async (req, res) => {
  const data = await receptionService.getQueueStats(
    req.user.clinicId,
    req.params.queueId,
  );

  res.status(200).json({
    success: true,
    message: "Queue stats fetched successfully",
    data,
  });
};

// ─── WRITE ────────────────────────────────────────────────────────

// POST /reception/queues/:queueId/call-next

// POST /reception/queues/:queueId/call-next
export const callNext = async (req, res) => {
  const data = await receptionService.callNextTicket(
    req.user.clinicId,
    req.params.queueId,
  );

  if (data.ticket) {
    await emitTicketCalled(req.user.clinicId, data.ticket);
  }

  res.status(200).json({
    success: true,
    message: "Next ticket called successfully",
    data,
  });
};

// PATCH /reception/tickets/:id/call
// PATCH /reception/tickets/:id/call
export const callSpecific = async (req, res) => {
  const data = await receptionService.callSpecificTicket(
    req.user.clinicId,
    req.body.queueId,
    req.params.id,
  );

  if (data.ticket) {
    await emitTicketCalled(req.user.clinicId, data.ticket);
  }

  res.status(200).json({
    success: true,
    message: "Ticket called successfully",
    data,
  });
};

// PATCH /reception/tickets/:id/done (with idempotency)
export const markDone = async (req, res, next) => {
  try {
    const data = await receptionService.markTicketDone(
      req.user.clinicId,
      req.params.id,
    );

    res.status(200).json({
      success: true,
      message: "Ticket marked as done",
      data,
    });
  } catch (error) {
    // Idempotency: if ticket is already done, return 200 instead of error
    if (error.statusCode === 404) {
      const existing = await Ticket.findById(req.params.id).lean();
      if (existing && existing.status === "done") {
        return res.status(200).json({
          success: true,
          message: "Ticket already completed",
          data: existing,
        });
      }
    }
    next(error);
  }
};

// PATCH /reception/tickets/:id/skip
export const skipTicket = async (req, res) => {
  const data = await receptionService.skipTicket(
    req.user.clinicId,
    req.body.queueId,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Ticket skipped to end of queue",
    data,
  });
};

// PATCH /reception/tickets/:id/recall
export const recallTicket = async (req, res) => {
  const data = await receptionService.recallTicket(
    req.user.clinicId,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Ticket recalled successfully",
    data,
  });
};
