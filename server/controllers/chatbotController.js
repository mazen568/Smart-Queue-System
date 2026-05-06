import { chat } from "../services/chatbotService.js";
import { AppError } from "../helpers/AppError.js";

/**
 * POST /api/v1/chatbot/message
 * Body: { message: string, history?: array }
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      throw new AppError("Message is required.", 400);
    }

    if (message.trim().length > 500) {
      throw new AppError("Message is too long (max 500 characters).", 400);
    }

    const result = await chat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        history: result.history,
      },
    });
  } catch (error) {
    next(error);
  }
};
