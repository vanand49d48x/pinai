import { z } from "zod";

export const createPinSchema = z.object({
  image_url: z.string().url(),
  destination_link: z.string().url().optional().nullable(),
  topic: z.string().min(1).max(200),
  keywords: z.string().max(500).default(""),
  board_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
});

export const updatePinSchema = z.object({
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  alt_text: z.string().max(500).optional().nullable(),
  board_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  status: z
    .enum(["draft", "ready", "scheduled", "failed"])
    .optional(),
  destination_link: z.string().url().optional().nullable(),
});

export const bulkPinSchema = z.object({
  pins: z.array(
    z.object({
      image_url: z.string().url(),
      topic: z.string().min(1),
      keywords: z.string().default(""),
      destination_link: z.string().url().optional().nullable(),
      board_name: z.string().optional(),
      scheduled_at: z.string().optional().nullable(),
    })
  ),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type BulkPinInput = z.infer<typeof bulkPinSchema>;
