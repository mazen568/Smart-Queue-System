import express from "express";
import { 
  browseClinics, 
  getClinicDetails, 
  takeTicket, 
  getMyTicketStatus,
  getQueueWaitingList,
  getQueueStats,
  listQueues,
  getQueue,
  listWaitingTicketsForQueue
} from "../controllers/patientController.js";
import { validateZodBody, validateZodParams } from "../middlewares/zodValidationMiddleware.js";
import { takeTicketSchema, idParamSchema } from "../validations/patientValidations.js";

const router = express.Router();

// Browse all active clinics
router.get("/clinics", browseClinics);

// Get clinic specific queues/details
router.get("/clinics/:id", validateZodParams(idParamSchema), getClinicDetails);

// Issue a new ticket for a specific queue
router.post("/tickets", validateZodBody(takeTicketSchema), takeTicket);

// Track status of an existing ticket
router.get("/tickets/:id", validateZodParams(idParamSchema), getMyTicketStatus);

// Get waiting list for a specific queue
router.get("/queues/:id/waiting", validateZodParams(idParamSchema), getQueueWaitingList);

// Get stats for a specific queue
router.get("/queues/:id/stats", validateZodParams(idParamSchema), getQueueStats);

// Additional endpoints to match the "public" API shape
router.get("/queues", listQueues); // ?clinicId=...
router.get("/queues/:id", validateZodParams(idParamSchema), getQueue);
router.get("/tickets/queue/:queueId", listWaitingTicketsForQueue);

export default router;
