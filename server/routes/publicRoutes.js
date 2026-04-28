import express from "express";
import {
  browseClinics,
  getClinicDetails,
  listQueues,
  getQueue,
  takeTicket,
  getMyTicketStatus,
  listWaitingTicketsForQueue,
} from "../controllers/patientController.js";
import { validateZodBody, validateZodParams } from "../middlewares/zodValidationMiddleware.js";
import { takeTicketSchema, idParamSchema } from "../validations/patientValidations.js";

const router = express.Router();

// Clinics (public)
router.get("/clinics", browseClinics);
router.get("/clinics/:id", validateZodParams(idParamSchema), getClinicDetails);

// Queues (public)
router.get("/queues", listQueues); // ?clinicId=...
router.get("/queues/:id", validateZodParams(idParamSchema), getQueue);

// Tickets (public)
router.post("/tickets", validateZodBody(takeTicketSchema), takeTicket);
router.get("/tickets/:id", validateZodParams(idParamSchema), getMyTicketStatus);
router.get("/tickets/queue/:queueId", listWaitingTicketsForQueue);

export default router;

