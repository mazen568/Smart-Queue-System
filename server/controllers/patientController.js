import Clinic from "../models/clinicModel.js";
import Queue from "../models/queueModel.js";
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
    res.status(200).json({
      success: true,
      message: "Clinics fetched successfully",
      data: clinics,
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
    
    res.status(200).json({
      success: true,
      data: { clinic, queues },
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

    // Notify all connected clients in the clinic room
    const io = getIO();
    io.to(`clinic:${clinicId}`).emit("queueUpdated", {
      queueId,
      newNumber: ticketData.ticket.number,
      waitingCount: ticketData.position + 1
    });

    res.status(201).json({
      success: true,
      message: "Ticket issued successfully",
      data: ticketData,
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
    const queue = await Queue.findById(req.params.id).select("name currentNumber avgServiceTime").lean();
    if (!queue) return res.status(404).json({ success: false, message: "Queue not found" });

    const waitingCount = await Ticket.countDocuments({ queueId: queue._id, status: "waiting" });

    res.status(200).json({
      success: true,
      data: {
        ...queue,
        waitingCount
      },
    });
  } catch (error) {
    next(error);
  }
};
