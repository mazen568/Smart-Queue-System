import mongoose from "mongoose";
import fs from "fs";
import Clinic from "../models/clinicModel.js";
import Queue from "../models/queueModel.js";
import User from "../models/userModel.js";
import Ticket from "../models/ticketModel.js";
import AuditLog from "../models/auditLogModel.js";
import { logAction } from "../services/auditService.js";
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

    await logAction(req.user.clinicId, req.user._id, 'UPDATE_SETTINGS', 'Updated clinic details', req);

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

    await logAction(req.user.clinicId, req.user._id, 'UPDATE_SETTINGS', `Clinic ${clinic.isActive ? "activated" : "deactivated"}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'CREATE_QUEUE', `Created queue: ${queue.name}`, req);

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
    
    // Pagination & Search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const matchQuery = {
      clinicId: new mongoose.Types.ObjectId(String(clinicId)),
      isActive: { $ne: false },
    };

    if (search) {
      matchQuery.name = { $regex: search, $options: 'i' };
    }

    const total = await Queue.countDocuments(matchQuery);

    const queues = await Queue.aggregate([
      {
        $match: matchQuery,
      },
      { $skip: skip },
      { $limit: limit },
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
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
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

    await logAction(req.user.clinicId, req.user._id, 'UPDATE_QUEUE', `Updated queue: ${queue.name}`, req);

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
    const queue = await Queue.findByIdAndUpdate(req.params.id, { isActive: false });

    await logAction(req.user.clinicId, req.user._id, 'DELETE_QUEUE', `Deleted queue: ${queue.name}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'RESET_QUEUE', `Reset queue counter for: ${queue.name}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'CREATE_STAFF', `Created staff account for: ${staff.email}`, req);

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {
      clinicId: req.user.clinicId,
      role: "reception",
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const staff = await User.find(query).skip(skip).limit(limit).select("-password");

    res.status(200).json({
      success: true,
      data: staff,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
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
    const deletedStaff = await User.findByIdAndDelete(req.params.id);

    if (deletedStaff) {
      await logAction(req.user.clinicId, req.user._id, 'DELETE_STAFF', `Removed staff account: ${deletedStaff.email}`, req);
    }

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

    await logAction(req.user.clinicId, req.user._id, 'RESET_PASSWORD', `Reset password for staff: ${user.email}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'CALL_TICKET', `Called patient: P-${ticket.number}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'COMPLETE_TICKET', `Completed patient: P-${ticket.number}`, req);

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

    await logAction(req.user.clinicId, req.user._id, 'UPDATE_SETTINGS', `Uploaded new clinic logo`, req);

    res.status(200).json({
      success: true,
      data: { logoUrl },
      message: "Logo uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get clinic activity (audit logs)
// @route   GET /api/admin/activity
// @access  Private (Admin)
export const getActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { clinic: req.user.clinicId };

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      message: "Activity logs fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global search across patients, queues, and staff
// @route   GET /api/admin/search
// @access  Private (Admin)
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: { staff: [], queues: [], patients: [] } });
    }

    const clinicId = req.user.clinicId;
    const regex = new RegExp(q, 'i');

    const [staff, queues, patients] = await Promise.all([
      User.find({
        clinicId,
        role: "reception",
        $or: [{ name: regex }, { email: regex }]
      }).limit(5).select("name email role"),
      
      Queue.find({
        clinicId,
        isActive: true,
        name: regex
      }).limit(5).select("name currentNumber"),
      
      Ticket.find({
        clinicId,
        $or: [{ number: regex }]
      }).limit(5).select("number status createdAt queueId").populate('queueId', 'name')
    ]);

    // Format patients to match UI needs
    const formattedPatients = patients.map(p => ({
      _id: p._id,
      number: p.number,
      status: p.status,
      queueName: p.queueId ? p.queueId.name : 'Unknown Queue',
      createdAt: p.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        staff,
        queues,
        patients: formattedPatients
      },
      message: "Search completed successfully",
    });
  } catch (error) {
    next(error);
  }
};

