import { z } from "zod";

export const createSchema = z.object({
	body: z.object({
		name: z.string().min(1).max(255),
		description: z.string().min(1),
		price: z.number().nonnegative(),
	}),
});

export const updateSchema = z.object({
	params: z.object({ id: z.string().regex(/^\d+$/) }),
	body: z.object({
		name: z.string().min(1).max(255).optional(),
		description: z.string().min(1).optional(),
		price: z.number().nonnegative().optional(),
	}),
});

export const searchSchema = z.object({
	query: z.object({
		q: z.string().min(1),
		page: z.string().regex(/^\d+$/).transform(Number).optional(),
		limit: z.string().regex(/^\d+$/).transform(Number).optional(),
	}),
});
export const registerSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
});

export const loginSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
});

export const productSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	price: z.number().positive(),
});

