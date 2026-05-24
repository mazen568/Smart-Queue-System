import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:4200",
        process.env.CLIENT_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Optional auth: allow token in handshake, but do not block patients.
    // (Future: validate JWT and attach user info to socket.data)
    if (socket.handshake?.auth?.token) {
      socket.data.tokenProvided = true;
    }

    // Join a specific clinic room for scoped broadcasts
    socket.on("join-clinic", (clinicId) => {
      socket.join(`clinic:${clinicId}`);
      console.log(`Socket ${socket.id} joined clinic room: ${clinicId}`);
    });

    // Alias to match other clients
    socket.on("joinClinic", (clinicId) => {
      socket.join(`clinic:${clinicId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
export const emitTicketCalled = async (clinicId, ticket) => {
  try {
    const io = getIO();
    io.to(`clinic:${clinicId}`).emit("ticketCalled", {
      ticketId: ticket._id,
      ticketNumber: ticket.number,
      queueId: ticket.queueId,
      calledAt: ticket.calledAt,
    });

    // Trigger web push notification
    const notificationService = await import("../services/notificationService.js");
    await notificationService.notifyTicketCalled(ticket._id, clinicId, {
      number: ticket.number,
      queueId: ticket.queueId,
    });
  } catch (error) {
    console.error("Error emitting ticket called event:", error);
  }
};
