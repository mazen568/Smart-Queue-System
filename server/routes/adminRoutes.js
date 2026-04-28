import {
  getClinicDetails,
  updateClinicDetails,
  updateClinicStatus,
  createQueue,
  getQueues,
  updateQueue,
  deleteQueue,
  resetQueue,
  createStaff,
  getStaff,
  deleteStaff,
  resetStaffPassword,
  getOverviewStats,
  callTicket,
  completeTicket,
} from "../controllers/adminController.js";
import authenticate from "../middlewares/authenticationMiddleware.js";
import authorize from "../middlewares/authorizationMiddleware.js";
import { isolateClinic } from "../middlewares/isolateClinicMiddleware.js";
import Queue from "../models/queueModel.js";
import User from "../models/userModel.js";
import express from "express";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Clinic Management
router.get("/clinic", getClinicDetails);
router.put("/clinic", updateClinicDetails);
router.patch("/clinic/status", updateClinicStatus);

// Queue Management
router.post("/queues", createQueue);
router.get("/queues", getQueues);
router.put("/queues/:id", isolateClinic(Queue), updateQueue);
router.delete("/queues/:id", isolateClinic(Queue), deleteQueue);
router.patch("/queues/:id/reset", isolateClinic(Queue), resetQueue);

// Staff Management
router.post("/staff", createStaff);
router.get("/staff", getStaff);
router.delete("/staff/:id", isolateClinic(User), deleteStaff);
router.patch("/staff/:id/reset-password", isolateClinic(User), resetStaffPassword);

// Overview
router.get("/overview", getOverviewStats);

// Tickets (for queue operations / patient real-time updates)
router.post("/tickets/:id/call", callTicket);
router.post("/tickets/:id/done", completeTicket);

export default router;
