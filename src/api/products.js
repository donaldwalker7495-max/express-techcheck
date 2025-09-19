import express from "express";
import { body, param, validationResult } from "express-validator";
import { hasDb, dbQuery } from "../db.js";

const router = express.Router();

// In-memory store for products
// Each product: { id: number, name: string, description: string, price: number, created_at: string ISO }
let products = [];
let nextId = 1;

// Validation utilities
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }
    next();
  },
];

const createValidators = [
  body("name").isString().trim().notEmpty().withMessage("name is required"),
  body("description").isString().trim().notEmpty().withMessage("description is required"),
  body("price").isFloat({ min: 0 }).withMessage("price must be >= 0").toFloat(),
];

const updateValidators = [
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional().isString().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }).toFloat(),
  body().custom(body => {
    const fields = ["name", "description", "price"];
    if (fields.some(f => Object.prototype.hasOwnProperty.call(body, f))) return true;
    throw new Error("At least one field must be provided");
  }),
];

// Helpers
function findIndexById(id) {
  return products.findIndex(p => p.id === id);
}

// GET /api/v1/products/search?q=...&page=1&limit=10
router.get(
  "/search",
  validate([
    // q is required non-empty string
    body().custom((_body, { req }) => {
      const q = (req.query.q ?? "").toString();
      if (!q.trim()) throw new Error("q query is required");
      return true;
    }),
  ]),
  async (req, res) => {
    const q = (req.query.q ?? "").toString();
    const page = Math.max(1, Number.parseInt(req.query.page ?? "1", 10));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit ?? "10", 10)));
    const offset = (page - 1) * limit;

    if (hasDb()) {
      // MySQL: case-insensitive search using LIKE with lower() or collation
      const like = `%${q}%`;
      const rows = await dbQuery(
        "SELECT id, name, description, price, created_at FROM products WHERE LOWER(name) LIKE LOWER(?) ORDER BY id LIMIT ? OFFSET ?",
        [like, limit, offset],
      );
      if (rows.length === 0) return res.json({ message: "No products found" });
      return res.json(rows);
    }

    // In-memory fallback (case-insensitive)
    const needle = q.toLowerCase();
    const matches = products.filter(p => p.name.toLowerCase().includes(needle));
    if (matches.length === 0) return res.json({ message: "No products found" });
    const paged = matches.slice(offset, offset + limit);
    return res.json(paged);
  },
);

// GET /api/v1/products -> all products
router.get("/", (req, res) => {
  res.json(products);
});

// GET /api/v1/products/:id -> product by id
router.get(
  "/:id",
  validate([param("id").isInt({ min: 1 }).withMessage("Invalid id")]),
  (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  },
);

// POST /api/v1/products -> create a product
router.post(
  "/",
  validate(createValidators),
  (req, res) => {
    const { name, description, price } = req.body;
    const now = new Date().toISOString();
    const product = { id: nextId++, name, description, price, created_at: now };
    products.push(product);
    res.status(201).json(product);
  },
);

// PUT /api/v1/products/:id -> update a product
router.put(
  "/:id",
  validate([param("id").isInt({ min: 1 }).withMessage("Invalid id"), ...updateValidators]),
  (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const idx = findIndexById(id);
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    const updated = { ...products[idx], ...req.body };
    products[idx] = updated;
    res.json(updated);
  },
);

// DELETE /api/v1/products/:id -> delete a product
router.delete(
  "/:id",
  validate([param("id").isInt({ min: 1 }).withMessage("Invalid id")]),
  (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const idx = findIndexById(id);
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    const [deleted] = products.splice(idx, 1);
    res.json({ success: true, deleted });
  },
);

export default router;
