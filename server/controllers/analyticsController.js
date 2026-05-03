import * as analyticsService from "../services/analyticsService.js";
import { AppError } from "../helpers/AppError.js";

export const getOverviewStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewStats(req.user.clinicId);
    res.status(200).json({
      success: true,
      message: "Overview stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyTickets = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError(
        "from and to date parameters are required",
        400
      );
    }

    const data = await analyticsService.getDailyTickets(
      req.user.clinicId,
      from,
      to
    );

    res.status(200).json({
      success: true,
      message: "Daily tickets fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getWaitTimePerQueue = async (req, res, next) => {
  try {
    const data = await analyticsService.getWaitTimePerQueue(
      req.user.clinicId
    );

    res.status(200).json({
      success: true,
      message: "Wait time stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPeakHours = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError(
        "from and to date parameters are required",
        400
      );
    }

    const data = await analyticsService.getPeakHours(
      req.user.clinicId,
      from,
      to
    );

    res.status(200).json({
      success: true,
      message: "Peak hours fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
