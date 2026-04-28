import Ticket from "../models/ticketModel.js";
import Queue from "../models/queueModel.js";
import { AppError } from "../helpers/AppError.js";

/**
 * Creates a new ticket atomically by incrementing the queue's currentNumber.
 * Ensures no two tickets in the same queue have the same number.
 */
export const generateTicket = async ({ clinicId, queueId, customerName }) => {
  // 1. Atomically increment currentNumber and verify queue status
  const queue = await Queue.findOneAndUpdate(
    { _id: queueId, clinicId, isActive: true },
    { $inc: { currentNumber: 1 } },
    { new: true, runValidators: true }
  );

  if (!queue) {
    throw new AppError("The selected doctor is currently unavailable or the clinic does not exist.", 404);
  }

  // 2. Create the ticket session
  const ticket = await Ticket.create({
    clinicId,
    queueId,
    number: queue.currentNumber,
    customerName,
  });

  // 3. Calculate position and wait time for the response
  const position = await calculatePosition(queueId, ticket.createdAt);

  return {
    ticket,
    position,
    estimatedWaitTime: position * queue.avgServiceTime,
  };
};

/**
 * Fetches ticket status and calculates live position in the queue.
 */
export const getTicketStatus = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId).populate("queueId", "name avgServiceTime currentNumber");
  if (!ticket) {
    throw new AppError("Ticket session not found.", 404);
  }

  const position = await calculatePosition(ticket.queueId._id, ticket.createdAt);

  return {
    ticket,
    position,
    estimatedWaitTime: position * ticket.queueId.avgServiceTime,
  };
};

/**
 * Returns the list of tickets still in 'waiting' status for a specific queue.
 */
export const getWaitingTickets = async (queueId) => {
  return await Ticket.find({ queueId, status: "waiting" })
    .sort({ createdAt: 1 })
    .select("number customerName createdAt");
};

/**
 * Helper to calculate how many 'waiting' tickets are ahead of a given time.
 */
const calculatePosition = async (queueId, createdAt) => {
  return await Ticket.countDocuments({
    queueId,
    status: "waiting",
    createdAt: { $lt: createdAt },
  });
};
