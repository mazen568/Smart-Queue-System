import Ticket from "../models/ticketModel.js";
import Queue from "../models/queueModel.js";
import { cache } from "../utils/cache.js";
		import mongoose from "mongoose";


export const getOverviewStats = async (clinicId) => {
  try {
    const clinicObjectId = new mongoose.Types.ObjectId(
      clinicId._id || clinicId
    );
    const cacheKey = `analytics:overview:${clinicObjectId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Ticket.aggregate([
      { $match: { clinicId: clinicObjectId } },
      {
        $facet: {
          today: [
            {
              $match: { createdAt: { $gte: startOfToday } },
            },
            { $count: "count" },
          ],
          thisWeek: [
            {
              $match: { createdAt: { $gte: startOfWeek } },
            },
            { $count: "count" },
          ],
          thisMonth: [
            {
              $match: { createdAt: { $gte: startOfMonth } },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const stats = {
      today: result[0].today[0]?.count || 0,
      thisWeek: result[0].thisWeek[0]?.count || 0,
      thisMonth: result[0].thisMonth[0]?.count || 0,
    };

    cache.set(cacheKey, stats, 300);
    return stats;
  } catch (error) {
    console.error("Error in getOverviewStats:", error);
    throw error;
  }
};

export const getDailyTickets = async (clinicId, fromDate, toDate) => {
	try{



const clinicObjectId = new mongoose.Types.ObjectId(
  clinicId._id || clinicId
);

const tickets = await Ticket.aggregate([
  {
    $match: {
      clinicId: clinicObjectId,
      createdAt: {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
      },
    },
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
          timezone: "Africa/Cairo", // important
        },
      },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      date: "$_id",
      count: 1,
    },
  },
  {
    $sort: { date: 1 },
  },
]);

return tickets;
	}catch (error) {
		console.error("Error in getDailyTickets:", error);
		throw error;
	}
};

export const getWaitTimePerQueue = async (clinicId) => {
  try {
    const clinicObjectId = new mongoose.Types.ObjectId(
      clinicId._id || clinicId
    );
    const cacheKey = `analytics:waittime:${clinicObjectId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await Ticket.aggregate([
      {
        $match: {
          clinicId: clinicObjectId,
          status: "done",
          completedAt: { $exists: true },
        },
      },
      {
        $addFields: {
          waitTime: {
            $divide: [
              { $subtract: ["$completedAt", "$createdAt"] },
              60000, // Convert ms to minutes
            ],
          },
        },
      },
      {
        $group: {
          _id: "$queueId",
          avgWaitTime: { $avg: "$waitTime" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "queues",
          localField: "_id",
          foreignField: "_id",
          as: "queue",
        },
      },
      {
        $unwind: "$queue",
      },
      {
        $project: {
          queueName: "$queue.name",
          avgWaitTime: { $round: ["$avgWaitTime", 2] },
          ticketCount: "$count",
          _id: 0,
        },
      },
    ]);

    cache.set(cacheKey, result, 300);
    return result;
  } catch (error) {
    console.error("Error in getWaitTimePerQueue:", error);
    throw error;
  }
};

export const getPeakHours = async (clinicId, fromDate, toDate) => {
  try {
    const clinicObjectId = new mongoose.Types.ObjectId(
      clinicId._id || clinicId
    );
    const cacheKey = `analytics:peakhours:${clinicObjectId}:${fromDate}:${toDate}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await Ticket.aggregate([
      {
        $match: {
          clinicId: clinicObjectId,
          createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          hour: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Fill in missing hours
    const allHours = [];
    for (let i = 0; i < 24; i++) {
      const found = result.find((r) => r.hour === i);
      allHours.push(found || { hour: i, count: 0 });
    }

    cache.set(cacheKey, allHours, 300);
    return allHours;
  } catch (error) {
    console.error("Error in getPeakHours:", error);
    throw error;
  }
};
