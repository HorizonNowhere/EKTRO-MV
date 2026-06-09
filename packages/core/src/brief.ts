import { z } from 'zod';

export const RatioSchema = z.enum(['9:16', '16:9', '1:1']);
export const ResolutionSchema = z.enum(['480p', '720p', '1080p']);
export const LanguageSchema = z.enum(['zh', 'en']);

export const CreativeBriefSchema = z.object({
  title: z.string().min(1),
  style: z.string().min(1),
  language: LanguageSchema.default('zh'),
  song: z.object({
    tags: z.string().min(1),
    lyrics: z.string().min(1),
    durationSec: z.number().int().min(30).max(300),
  }),
  video: z.object({
    /** Overall scene description; used as the single shot when `shots` is omitted. */
    prompt: z.string().min(1),
    /** Optional per-shot prompts — each becomes one generated clip, sequenced across the song. */
    shots: z.array(z.string().min(1)).min(1).max(6).optional(),
    ratio: RatioSchema.default('9:16'),
    resolution: ResolutionSchema.default('480p'),
  }),
});

export type CreativeBrief = z.infer<typeof CreativeBriefSchema>;
