import mongoose from "mongoose";
import fs from "fs";
import Clinic from "../models/clinicModel.js";
import Queue from "../models/queueModel.js";
import User from "../models/userModel.js";
import Ticket from "../models/ticketModel.js";
import { AppError } from "../helpers/AppError.js";
import { getIO } from "../config/socket.config.js";

// @desc    Get current clinic details
// @route   GET /api/admin/clinic
// @access  Private (Admin)
export const getClinicDetails = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) {
      return next(new AppError("Clinic not found", 404));
    }

    res.status(200).json({
      success: true,
      data: clinic,
      message: "Clinic details fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update clinic details
// @route   PUT /api/admin/clinic
// @access  Private (Admin)
export const updateClinicDetails = async (req, res, next) => {
  try {
    const { name, description, address, logoUrl } = req.body;

    const clinic = await Clinic.findByIdAndUpdate(
      req.user.clinicId,
      { name, description, address, logoUrl },
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return next(new AppError("Clinic not found", 404));
    }

    res.status(200).json({
      success: true,
      data: clinic,
      message: "Clinic updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate / Deactivate clinic
// @route   PATCH /api/admin/clinic/status
// @access  Private (Admin)
export const updateClinicStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return next(new AppError("isActive status is required", 400));
    }

    const clinic = await Clinic.findByIdAndUpdate(
      req.user.clinicId,
      { isActive },
      { new: true }
    );

    if (!clinic) {
      return next(new AppError("Clinic not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { isActive: clinic.isActive },
      message: `Clinic ${clinic.isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// --- Phase 2: Queue Management ---

// @desc    Create new queue
// @route   POST /api/admin/queues
// @access  Private (Admin)
export const createQueue = async (req, res, next) => {
  try {
    const { name, avgServiceTime } = req.body;

    const queue = await Queue.create({
      name,
      avgServiceTime,
      clinicId: req.user.clinicId,
    });

    res.status(201).json({
      success: true,
      data: queue,
      message: "Queue created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all queues for clinic
// @route   GET /api/admin/queues
// @access  Private (Admin)
export const getQueues = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    const queues = await Queue.aggregate([
      {
        $match: {
          clinicId: new mongoose.Types.ObjectId(String(clinicId)),
          isActive: { $ne: false },
        },
      },
      {
        $lookup: {
          from: "tickets",
          let: { queueId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$queueId", "$$queueId"] },
                    { $eq: ["$status", "waiting"] },
                  ],
                },
              },
            },
          ],
          as: "waitingTickets",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          currentNumber: 1,
          avgServiceTime: 1,
          isActive: 1,
          totalServedCount: 1,
          waitingCount: { $size: "$waitingTickets" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: queues,
      message: "Queues fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update queue details
// @route   PUT /api/admin/queues/:id
// @access  Private (Admin)
export const updateQueue = async (req, res, next) => {
  try {
    const { name, avgServiceTime } = req.body;

    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { name, avgServiceTime },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: queue,
      message: "Queue updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft-delete queue
// @route   DELETE /api/admin/queues/:id
// @access  Private (Admin)
export const deleteQueue = async (req, res, next) => {
  try {
    await Queue.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: "Queue deleted (deactivated) successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset queue counter
// @route   PATCH /api/admin/queues/:id/reset
// @access  Private (Admin)
export const resetQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { currentNumber: 0 },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: queue,
      message: "Queue counter reset successfully",
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Create reception staff account
// @route   POST /api/admin/staff
// @access  Private (Admin)
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("User already exists with this email", 400));
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: "reception",
      clinicId: req.user.clinicId,
    });

    res.status(201).json({
      success: true,
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      message: "Staff account created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all staff for clinic
// @route   GET /api/admin/staff
// @access  Private (Admin)
export const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      clinicId: req.user.clinicId,
      role: "reception",
    });

    res.status(200).json({
      success: true,
      data: staff,
      message: "Staff list fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff account
// @route   DELETE /api/admin/staff/:id
// @access  Private (Admin)
export const deleteStaff = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Staff account removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset staff password
// @route   PATCH /api/admin/staff/:id/reset-password
// @access  Private (Admin)
export const resetStaffPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return next(new AppError("New password is required", 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Staff password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get admin overview stats
// @route   GET /api/admin/overview
// @access  Private (Admin)
export const getOverviewStats = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;

    // Start of today (midnight) for daily stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      activeQueuesCount,
      ticketsServedToday,
      liveQueues,
      waitingPatients,
      recentServed,
    ] = await Promise.all([
      // Total tickets ever for this clinic
      Ticket.countDocuments({ clinicId }),

      // Active queues count
      Queue.countDocuments({ clinicId, isActive: { $ne: false } }),

      // Tickets served today
      Ticket.countDocuments({
        clinicId,
        status: "done",
        createdAt: { $gte: todayStart },
      }),

      // Live queue breakdown: each queue with its waiting ticket count
      Queue.aggregate([
        {
          $match: {
            clinicId: new mongoose.Types.ObjectId(String(clinicId)),
            isActive: { $ne: false },
          },
        },
        {
          $lookup: {
            from: "tickets",
            let: { queueId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$queueId", "$$queueId"] },
                      { $eq: ["$status", "waiting"] },
                    ],
                  },
                },
              },
            ],
            as: "waitingTickets",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            currentNumber: 1,
            avgServiceTime: 1,
            waitingCount: { $size: "$waitingTickets" },
          },
        },
        { $sort: { waitingCount: -1 } },
      ]),

      // Recent Waiting Patients
      Ticket.aggregate([
        {
          $match: {
            clinicId: new mongoose.Types.ObjectId(String(clinicId)),
            status: "waiting",
          },
        },
        { $sort: { createdAt: 1 } }, // Oldest first (next in line)
        { $limit: 10 },
        {
          $lookup: {
            from: "queues",
            localField: "queueId",
            foreignField: "_id",
            as: "queue",
          },
        },
        { $unwind: "$queue" },
        {
          $project: {
            _id: 1,
            number: 1,
            status: 1,
            createdAt: 1,
            queueName: "$queue.name",
          },
        },
      ]),

      // Recent Served Patients (Today)
      Ticket.aggregate([
        {
          $match: {
            clinicId: new mongoose.Types.ObjectId(String(clinicId)),
            status: "done",
            completedAt: { $gte: todayStart },
          },
        },
        { $sort: { completedAt: -1 } }, // Most recent first
        { $limit: 10 },
        {
          $lookup: {
            from: "queues",
            localField: "queueId",
            foreignField: "_id",
            as: "queue",
          },
        },
        { $unwind: "$queue" },
        {
          $project: {
            _id: 1,
            number: 1,
            status: 1,
            completedAt: 1,
            queueName: "$queue.name",
          },
        },
      ]),
    ]);

    // Average wait time across all active queues (in minutes)
    const avgWaitTime =
      liveQueues.length > 0
        ? Math.round(
          liveQueues.reduce((sum, q) => sum + q.avgServiceTime, 0) /
          liveQueues.length
        )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        activeQueues: activeQueuesCount,
        avgWaitTime,
        ticketsServedToday,
        creditBalance: 0, // placeholder until Member 5 (Billing) delivers Credits model
        liveQueues,
        waitingPatients,
        recentServed,
      },
      message: "Overview stats fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Mark a ticket as called (Pick from waiting)
// @route   POST /api/admin/tickets/:id/call
// @access  Private (Admin)
export const callTicket = async (req, res, next) => {
  try {
    // Atomic update: only call if it's currently waiting
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        clinicId: req.user.clinicId,
        status: "waiting"
      },
      {
        $set: {
          status: "called",
          calledAt: new Date()
        }
      },
      { new: true }
    );

    if (!ticket) {
      return next(new AppError("Ticket not found, unauthorized, or already processed", 404));
    }

    const io = getIO();
    io.to(`clinic:${ticket.clinicId}`).emit("ticketCalled", {
      ticketId: ticket._id,
      number: ticket.number,
      queueId: ticket.queueId,
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a ticket as done
// @route   POST /api/admin/tickets/:id/done
// @access  Private (Admin)
export const completeTicket = async (req, res, next) => {
  try {
    // Atomic update: only complete if it's currently called
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        clinicId: req.user.clinicId,
        status: "called"
      },
      {
        $set: {
          status: "done",
          completedAt: new Date()
        }
      },
      { new: true }
    );

    if (!ticket) {
      return next(new AppError("Ticket not found, unauthorized, or not in 'called' state", 404));
    }

    // Increment totalServedCount for the queue
    await Queue.findByIdAndUpdate(ticket.queueId, {
      $inc: { totalServedCount: 1 }
    });

    const io = getIO();
    io.to(`clinic:${ticket.clinicId}`).emit("ticketDone", {
      ticketId: ticket._id,
      number: ticket.number,
      queueId: ticket.queueId,
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload clinic logo
// @route   POST /api/admin/clinic/logo
// @access  Private (Admin)
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload a file", 400));
    }

    const clinicId = req.user.clinicId;
    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
      return next(new AppError("Clinic not found", 404));
    }

    // Delete old logo if it exists and is a local file
    if (clinic.logoUrl && clinic.logoUrl.startsWith("/uploads/")) {
      const oldPath = clinic.logoUrl.split("/").pop();
      const fullPath = `./uploads/${oldPath}`;
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    clinic.logoUrl = logoUrl;
    await clinic.save();

    res.status(200).json({
      success: true,
      data: { logoUrl },
      message: "Logo uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};
