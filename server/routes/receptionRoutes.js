import express from "express";
import authenticate from "../middlewares/authenticationMiddleware.js";
import authorize from "../middlewares/authorizationMiddleware.js";
import {
  validateZodParams,
  validateZodBody,
} from "../middlewares/zodValidationMiddleware.js";
import {
  queueIdParamSchema,
  ticketIdParamSchema,
  callSpecificBodySchema,
  skipBodySchema,
} from "../validations/receptionValidations.js";
import {
  getQueues,
  getTickets,
  getStats,
  callNext,
  callSpecific,
  markDone,
  skipTicket,
  recallTicket,
} from "../controllers/receptionController.js";

const router = express.Router();

// All reception routes require auth + role (reception OR admin)
router.use(authenticate);
router.use(authorize("reception", "admin"));

// ─── Queue Read Routes ────────────────────────────────────────────
router.get("/queues", getQueues);
router.get(
  "/queues/:queueId/tickets",
  validateZodParams(queueIdParamSchema),
  getTickets,
);
router.get(
  "/queues/:queueId/stats",
  validateZodParams(queueIdParamSchema),
  getStats,
);

// ─── Ticket Action Routes ─────────────────────────────────────────
router.post(
  "/queues/:queueId/call-next",
  validateZodParams(queueIdParamSchema),
  callNext,
);
router.patch(
  "/tickets/:id/call",
  validateZodParams(ticketIdParamSchema),
  validateZodBody(callSpecificBodySchema),
  callSpecific,
);
router.patch(
  "/tickets/:id/done",
  validateZodParams(ticketIdParamSchema),
  markDone,
);
router.patch(
  "/tickets/:id/skip",
  validateZodParams(ticketIdParamSchema),
  validateZodBody(skipBodySchema),
  skipTicket,
);
router.patch(
  "/tickets/:id/recall",
  validateZodParams(ticketIdParamSchema),
  recallTicket,
);

export default router;
