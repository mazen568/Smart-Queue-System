import Clinic from "../models/clinicModel.js";
import Queue from "../models/queueModel.js";
import Ticket from "../models/ticketModel.js";
import * as ticketService from "./ticketService.js";
import { AppError } from "../helpers/AppError.js";

// ─── Config ────────────────────────────────────────────────────────
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile: best free Groq model for reliable tool/function calling
const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY_MESSAGES = 10;

// ─── System Prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SmartBot, a friendly assistant for SmartQueue — a medical clinic queue management system.

Your role is to help patients:
- Check their queue position and wait time
- Find clinics and queue status
- Cancel their ticket
- Answer questions about the system

IMPORTANT RULES:
- Always respond in the SAME LANGUAGE the patient uses (Arabic or English).
- NEVER write function calls or JSON in your replies. Use tools silently — the patient should only see the final answer.
- A "ticket ID" is a long internal database ID (like "507f1f77bcf86cd799439011"), NOT the short ticket number (#24). If a patient gives you their ticket number (e.g. "24" or "#24"), use the get_ticket_by_number tool instead.
- Be concise, warm, and empathetic.
- Never make up queue data — always use tools to get real information.`;

// ─── Tool Definitions (OpenAI format — works with OpenRouter) ──────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_ticket_status",
      description:
        "Get the status of a ticket by its internal MongoDB ID (a long hex string like '507f1f77bcf86cd799439011'). Use get_ticket_by_number instead if the patient gives a short ticket number like '24' or '#24'.",
      parameters: {
        type: "object",
        properties: {
          ticketId: {
            type: "string",
            description: "The MongoDB ObjectId of the ticket (long hex string, e.g. '507f1f77bcf86cd799439011')",
          },
        },
        required: ["ticketId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ticket_by_number",
      description:
        "Find and get the status of a ticket using its short visible number (like 24 or #24) as shown on the patient's ticket slip. Use this when the patient tells you their ticket number.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: {
            type: "number",
            description: "The short numeric ticket number shown on the patient's slip (e.g. 24)",
          },
        },
        required: ["ticketNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_clinics",
      description:
        "Get a list of all available clinics with their active queue counts.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clinic_queues",
      description:
        "Get all active queues for a specific clinic along with their current wait times.",
      parameters: {
        type: "object",
        properties: {
          clinicId: {
            type: "string",
            description: "The clinic ID to fetch queues for",
          },
        },
        required: ["clinicId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_ticket",
      description: "Cancel a patient's ticket so they leave the queue.",
      parameters: {
        type: "object",
        properties: {
          ticketId: {
            type: "string",
            description: "The ticket ID to cancel",
          },
        },
        required: ["ticketId"],
      },
    },
  },
];

// ─── Tool Executors ─────────────────────────────────────────────────
const toolExecutors = {
  get_ticket_status: async ({ ticketId }) => {
    const data = await ticketService.getTicketStatus(ticketId);
    return {
      ticketNumber: data.ticket.number,
      status: data.ticket.status,
      customerName: data.ticket.customerName,
      position: data.position,
      estimatedWaitTimeMinutes: Math.round(data.estimatedWaitTime),
      queueName: data.ticket.queueId?.name,
    };
  },

  get_ticket_by_number: async ({ ticketNumber }) => {
    // Find the most recent active ticket with this number
    const ticket = await Ticket.findOne({
      number: ticketNumber,
      status: { $in: ["waiting", "called"] },
    })
      .populate("queueId", "name avgServiceTime")
      .sort({ createdAt: -1 })
      .lean();

    if (!ticket) {
      return { error: `No active ticket found with number #${ticketNumber}. It may have been completed or cancelled.` };
    }

    // Calculate position
    const position = await Ticket.countDocuments({
      queueId: ticket.queueId._id,
      status: "waiting",
      createdAt: { $lt: ticket.createdAt },
    });

    const avgServiceTime = ticket.queueId?.avgServiceTime || 5;
    const estimatedWaitTimeMinutes = Math.round(position * avgServiceTime);

    return {
      ticketNumber: ticket.number,
      status: ticket.status,
      customerName: ticket.customerName,
      position: position + 1,
      estimatedWaitTimeMinutes,
      queueName: ticket.queueId?.name,
    };
  },

  get_all_clinics: async () => {
    const clinics = await Clinic.find({ isActive: true })
      .select("name description address")
      .lean();

    const ids = clinics.map((c) => c._id);
    const queueCounts = await Queue.aggregate([
      { $match: { clinicId: { $in: ids }, isActive: true } },
      { $group: { _id: "$clinicId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(queueCounts.map((x) => [String(x._id), x.count]));

    return clinics.map((c) => ({
      id: c._id,
      name: c.name,
      description: c.description,
      address: c.address,
      activeQueues: countMap.get(String(c._id)) || 0,
    }));
  },

  get_clinic_queues: async ({ clinicId }) => {
    const queues = await Queue.find({ clinicId, isActive: true })
      .select("name avgServiceTime")
      .lean();

    const queueIds = queues.map((q) => q._id);
    const waitCounts = await Ticket.aggregate([
      { $match: { queueId: { $in: queueIds }, status: "waiting" } },
      { $group: { _id: "$queueId", waitingCount: { $sum: 1 } } },
    ]);
    const waitMap = new Map(
      waitCounts.map((w) => [String(w._id), w.waitingCount])
    );

    return queues.map((q) => {
      const waiting = waitMap.get(String(q._id)) || 0;
      return {
        id: q._id,
        name: q.name,
        waitingPatients: waiting,
        estimatedWaitTimeMinutes: Math.round(waiting * (q.avgServiceTime || 5)),
      };
    });
  },

  cancel_ticket: async ({ ticketId }) => {
    await ticketService.cancelTicket(ticketId);
    return { success: true, message: "Ticket cancelled successfully." };
  },
};

// ─── Execute Tool Call ─────────────────────────────────────────────
const executeTool = async (toolName, args) => {
  const executor = toolExecutors[toolName];
  if (!executor) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
  try {
    const result = await executor(args);
    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ error: error.message || "Tool execution failed" });
  }
};

// ─── Retry Helper ──────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let rateLimitedUntil = 0;

const callWithRetry = async (body, maxRetries = 3) => {
  const apiKey = process.env.GROQ_API_KEY;

  // Reject immediately if we're in a known cooldown window
  const now = Date.now();
  if (rateLimitedUntil > now) {
    const waitSec = Math.ceil((rateLimitedUntil - now) / 1000);
    throw new AppError(
      `SmartBot is cooling down. Please try again in ${waitSec} seconds.`,
      429
    );
  }

  const delays = [10000, 20000, 40000]; // 10s → 20s → 40s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const waitMs = delays[attempt];
      rateLimitedUntil = Date.now() + waitMs;

      if (attempt === maxRetries - 1) {
        throw new AppError(
          `SmartBot is busy. Please wait ${waitMs / 1000} seconds and try again.`,
          429
        );
      }
      console.warn(
        `[SmartBot] Rate limited. Retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})...`
      );
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new AppError(
        errorBody?.error?.message || "AI service request failed",
        response.status
      );
    }

    rateLimitedUntil = 0;
    return response;
  }
};

// ─── Main Chat Function ────────────────────────────────────────────
export const chat = async ({ message, history = [] }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError("Groq API key is not configured.", 500);
  }

  // Trim history to avoid token overflow
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);

  // Build messages in OpenAI format
  let messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...trimmedHistory,
    { role: "user", content: message },
  ];

  // ── Agentic Loop ─────────────────────────────────────────────────
  while (true) {
    const response = await callWithRetry({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 500,
      temperature: 0.7,
    });

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new AppError("No response from AI model.", 500);
    }

    messages.push(assistantMessage);

    // No tool calls → return final reply
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        reply: assistantMessage.content,
        // Return history without system prompt for the client to store
        history: messages.slice(1),
      };
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      assistantMessage.tool_calls.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        };
      })
    );

    messages.push(...toolResults);
  }
};
