import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// GET /reception/queues/:queueId/tickets
// GET /reception/queues/:queueId/stats
// POST /reception/queues/:queueId/call-next
export const queueIdParamSchema = z.object({
  queueId: objectId,
});

// PATCH /reception/tickets/:id/done
// PATCH /reception/tickets/:id/skip
// PATCH /reception/tickets/:id/recall
export const ticketIdParamSchema = z.object({
  id: objectId,
});

// PATCH /reception/tickets/:id/call (call specific — needs queueId in body)
export const callSpecificBodySchema = z.object({
  queueId: objectId,
});

// PATCH /reception/tickets/:id/skip (needs queueId in body)
export const skipBodySchema = z.object({
  queueId: objectId,
});
