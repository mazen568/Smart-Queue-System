import Clinic from "../models/clinicModel.js";
import Queue from "../models/queueModel.js";
import Ticket from "../models/ticketModel.js";
import * as ticketService from "../services/ticketService.js";
import { getIO } from "../config/socket.config.js";

/**
 * Browsing clinics (Public)
 */
export const browseClinics = async (req, res, next) => {
  try {
    const clinics = await Clinic.find({ isActive: true })
      .select("name description address logoUrl")
      .lean();

    const ids = clinics.map((c) => c._id);
    const queueCounts = await Queue.aggregate([
      { $match: { clinicId: { $in: ids }, isActive: true } },
      { $group: { _id: "$clinicId", activeQueuesCount: { $sum: 1 } } },
    ]);
    const countMap = new Map(queueCounts.map((x) => [String(x._id), x.activeQueuesCount]));

    const data = clinics.map((c) => ({
      ...c,
      activeQueuesCount: countMap.get(String(c._id)) || 0,
    }));
    res.status(200).json({
      success: true,
      message: "Clinics fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a specific clinic with its active queues
 */
export const getClinicDetails = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id).lean();
    if (!clinic || !clinic.isActive) {
      return res.status(404).json({ success: false, message: "Clinic not found or inactive" });
    }

    const queues = await Queue.find({ clinicId: clinic._id, isActive: true }).lean();
    
    // Aggregate waiting counts in one go for efficiency
    const queueIds = queues.map((q) => q._id);
    const waits = await Ticket.aggregate([
      { $match: { queueId: { $in: queueIds }, status: "waiting" } },
      { $group: { _id: "$queueId", waitingCount: { $sum: 1 } } },
    ]);
    const waitMap = new Map(waits.map((w) => [String(w._id), w.waitingCount]));

    const enrichedQueues = queues.map((q) => {
      const waitingCount = waitMap.get(String(q._id)) || 0;
      return {
        ...q,
        waitingCount,
        estimatedWaitTime: waitingCount * (q.avgServiceTime || 0),
      };
    });

    res.status(200).json({
      success: true,
      data: { clinic, queues: enrichedQueues },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Take a ticket and broadcast a WebSocket event
 */
export const takeTicket = async (req, res, next) => {
  try {
    const { clinicId, queueId, customerName } = req.body;

    // Integrity Check: Ensure queue exists and belongs to the clinic
    const queue = await Queue.findOne({ _id: queueId, clinicId, isActive: true });
    if (!queue) {
      return res.status(400).json({ 
        success: false, 
        message: "The requested doctor is not available at this clinic." 
      });
    }
    
    const ticketData = await ticketService.generateTicket({
      clinicId,
      queueId,
      customerName,
    });

    const waitingCount = await Ticket.countDocuments({ queueId, status: "waiting" });

    // Notify all connected clients in the clinic room
    const io = getIO();
    io.to(`clinic:${clinicId}`).emit("ticketCreated", {
      ticketId: ticketData.ticket._id,
      queueId,
      clinicId,
      number: ticketData.ticket.number,
      createdAt: ticketData.ticket.createdAt,
    });
    io.to(`clinic:${clinicId}`).emit("queueUpdated", {
      queueId,
      currentNumber: ticketData.queue.currentNumber,
      waitingCount,
    });

    res.status(201).json({
      success: true,
      message: "Ticket issued successfully",
      data: {
        id: ticketData.ticket._id,
        number: ticketData.ticket.number,
        position: ticketData.position,
        waitTime: ticketData.estimatedWaitTime,
        // Keep backward-compatible shape for existing UI
        ticket: ticketData.ticket,
        estimatedWaitTime: ticketData.estimatedWaitTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get live status of a single ticket
 */
export const getMyTicketStatus = async (req, res, next) => {
  try {
    const status = await ticketService.getTicketStatus(req.params.id);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a ticket (Leave the queue)
 */
export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.params.id);
    
    // Broadcast update to the clinic
    const waitingCount = await Ticket.countDocuments({ queueId: ticket.queueId, status: "waiting" });
    const io = getIO();
    io.to(`clinic:${ticket.clinicId}`).emit("queueUpdated", {
      queueId: ticket.queueId,
      waitingCount,
    });

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the waiting list for a specific queue (Public Transparency)
 */
export const getQueueWaitingList = async (req, res, next) => {
  try {
    const tickets = await ticketService.getWaitingTickets(req.params.id);
    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get live stats for a specific queue
 */
export const getQueueStats = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id).select("name clinicId currentNumber avgServiceTime").lean();
    if (!queue) return res.status(404).json({ success: false, message: "Queue not found" });

    const waitingCount = await Ticket.countDocuments({ queueId: queue._id, status: "waiting" });

    res.status(200).json({
      success: true,
      data: {
        ...queue,
        waitingCount,
        estimatedWaitTime: waitingCount * queue.avgServiceTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List queues for a clinic with live stats
 * GET /queues?clinicId=...
 */
export const listQueues = async (req, res, next) => {
  try {
    const { clinicId } = req.query;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: "clinicId is required" });
    }

    const queues = await Queue.find({ clinicId, isActive: true })
      .select("clinicId name currentNumber avgServiceTime isActive createdAt")
      .lean();

    const queueIds = queues.map((q) => q._id);
    const counts = await Ticket.aggregate([
      { $match: { queueId: { $in: queueIds }, status: "waiting" } },
      { $group: { _id: "$queueId", waitingCount: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.waitingCount]));

    const data = queues.map((q) => {
      const waitingCount = countMap.get(String(q._id)) || 0;
      return {
        ...q,
        waitingCount,
        estimatedWaitTime: waitingCount * (q.avgServiceTime || 0),
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single queue with live stats
 * GET /queues/:id
 */
export const getQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .select("clinicId name currentNumber avgServiceTime isActive createdAt")
      .lean();
    if (!queue || queue.isActive === false) {
      return res.status(404).json({ success: false, message: "Queue not found" });
    }
    const waitingCount = await Ticket.countDocuments({ queueId: queue._id, status: "waiting" });
    res.status(200).json({
      success: true,
      data: { ...queue, waitingCount, estimatedWaitTime: waitingCount * queue.avgServiceTime },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all waiting tickets for a queue
 * GET /tickets/queue/:queueId
 */
export const listWaitingTicketsForQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    const tickets = await ticketService.getWaitingTickets(queueId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};
