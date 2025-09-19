import express from "express";
import { z } from "zod/v4";
import { query } from "../db.js";

const router = express.Router();

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().nonnegative(),
});

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
}).refine(v => Object.keys(v).length > 0, { message: "At least one field required" });

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, name, description, price::float8 AS price, created_at FROM products ORDER BY created_at DESC");
    res.json(rows);
  }
  catch (err) {
    next(err);
  }
});

// Escape characters that have special meaning in SQL LIKE patterns
function escapeLike(input) {
  return input.replace(/[\\%_]/g, ch => `\\${ch}`);
}

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, { message: "Query parameter q is required" }).max(255),
  page: z.coerce.number().int().min(1).optional().default(1),
});

// GET /api/v1/products/search?q=...&page=1
router.get("/search", async (req, res, next) => {
  try {
    const { q, page } = searchQuerySchema.parse(req.query);
    const PAGE_SIZE = 10;
    const offset = (page - 1) * PAGE_SIZE;
    const likePattern = `%${escapeLike(q)}%`;

    const totalResult = await query(
      "SELECT COUNT(*)::int AS count FROM products WHERE name ILIKE $1 ESCAPE '\\'",
      [likePattern],
    );
    const total = totalResult.rows[0]?.count ?? 0;

    if (total === 0) {
      return res.status(200).json({ message: "No products found", results: [], page, pageSize: PAGE_SIZE, total });
    }

    const { rows } = await query(
      "SELECT id, name, description, price::float8 AS price, created_at FROM products WHERE name ILIKE $1 ESCAPE '\\' ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [likePattern, PAGE_SIZE, offset],
    );

    res.json({ results: rows, page, pageSize: PAGE_SIZE, total });
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      return next(new Error(err.issues.map(i => i.message).join(", ")));
    }
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400);
      throw new Error("Invalid id");
    }
    const { rows } = await query("SELECT id, name, description, price::float8 AS price, created_at FROM products WHERE id = $1", [id]);
    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(rows[0]);
  }
  catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = productCreateSchema.parse(req.body);
    const { rows } = await query(
      "INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price::float8 AS price, created_at",
      [parsed.name, parsed.description, parsed.price],
    );
    res.status(201).json(rows[0]);
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      return next(new Error(err.issues.map(i => i.message).join(", ")));
    }
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400);
      throw new Error("Invalid id");
    }
    const parsed = productUpdateSchema.parse(req.body);

    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(parsed)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
    values.push(id);
    const setClause = fields.join(", ");

    const { rows } = await query(
      `UPDATE products SET ${setClause} WHERE id = $${idx} RETURNING id, name, description, price::float8 AS price, created_at`,
      values,
    );
    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(rows[0]);
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      return next(new Error(err.issues.map(i => i.message).join(", ")));
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400);
      throw new Error("Invalid id");
    }
    const { rowCount } = await query("DELETE FROM products WHERE id = $1", [id]);
    if (rowCount === 0) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.status(204).send();
  }
  catch (err) {
    next(err);
  }
});

export default router;
