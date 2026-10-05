import { z } from "zod";

export const searchInput = z.object({
	text: z.string().trim().min(1).max(200),
	minLength: z.number().int().min(1).max(200).default(3),
});
