import { getIO } from "../config/socket.config.js";

export const emitTicketCalled = (clinicId, payload) => {
  const io = getIO();
  io.to(`clinic:${clinicId}`).emit("ticketCalled", payload);
};

export const emitQueueUpdated = (clinicId, payload) => {
  const io = getIO();
  io.to(`clinic:${clinicId}`).emit("queueUpdated", payload);
};

export const emitTicketDone = (clinicId, payload) => {
  const io = getIO();
  io.to(`clinic:${clinicId}`).emit("ticketDone", payload);
};
