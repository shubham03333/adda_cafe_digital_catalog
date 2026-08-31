import { z } from "zod";

export const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  tableNumber: z.number().int().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(2).max(2000),
});

export const ratingSchema = z.object({
  sessionId: z.string().uuid(),
  tableNumber: z.number().int().nullable().optional(),
  stars: z.number().int().min(1).max(5),
});

export const generateReviewsSchema = z.object({
  sessionId: z.string().uuid(),
  tableNumber: z.number().int().nullable().optional(),
  rating: z.number().int().min(4).max(5),
  orderedItems: z.array(z.string().trim().max(80)).max(20).default([]),
  service: z.string().trim().max(40).optional(),
  recommend: z.string().trim().max(40).optional(),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export const selectReviewSchema = z.object({
  sessionId: z.string().uuid(),
  reviewIndex: z.number().int().min(0).max(2),
  reviewText: z.string().min(10).max(2000),
  action: z.enum(["copy", "use"]),
});

export const settingsSchema = z.object({
  cafe_name: z.string().min(1).max(80),
  google_review_url: z
    .string()
    .url()
    .refine(
      (url) =>
        url.includes("google.com") ||
        url.includes("g.page") ||
        url.includes("maps.app.goo.gl"),
      "Must be a Google Maps / review URL"
    ),
  table_count: z.number().int().min(1).max(200),
});
