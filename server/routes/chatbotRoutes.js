import express from "express";
import { sendMessage } from "../controllers/chatbotController.js";

const router = express.Router();

// ─── Simple In-Memory Rate Limiter ────────────────────────────────
// Gemini free tier allows 15 RPM. We cap at 8 req/min per IP to stay safe.
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 8;
const requestCounts = new Map(); // { ip -> { count, windowStart } }

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    // New window
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000);
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please wait ${retryAfter} seconds before sending another message.`,
    });
  }

  record.count++;
  next();
};

// POST /api/v1/chatbot/message
// Public route — no auth required so patients can use it without logging in
router.post("/message", rateLimiter, sendMessage);

export default router;

