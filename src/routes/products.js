import { Router } from "express";
import pool from "../db.js";
import { productSchema } from "./schema.js";

export const productsRouter = Router();

productsRouter.post("/", async (req, res) => {
	try {
		const { name, description, price } = productSchema.parse(req.body);

		const [result] = await pool.query(
			"INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
			[name, description || "", price]
		);

		return res
			.status(201)
			.json({ id: result.insertId, name, description, price });
	} catch (err) {
		if (err.name === "ZodError") {
			return res.status(400).json({ error: err.errors });
		}
		return res.status(500).json({ error: err.message });
	}
});

productsRouter.get("/:id", async (req, res) => {
	try {
		const [rows] = await pool.query("SELECT * FROM products WHERE id=?", [
			req.params.id,
		]);

		if (rows.length === 0) {
			return res.status(404).json({ error: "Product not found" });
		}

		return res.json(rows[0]);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

productsRouter.put("/:id", async (req, res) => {
	try {
		const updates = {};
		if (req.body.name) updates.name = req.body.name;
		if (req.body.price) updates.price = req.body.price;

		const [result] = await pool.query("UPDATE products SET ? WHERE id=?", [
			updates,
			req.params.id,
		]);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Product not found" });
		}

		return res.json({ id: req.params.id, ...updates });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

productsRouter.delete("/:id", async (req, res) => {
	try {
		const [result] = await pool.query("DELETE FROM products WHERE id=?", [
			req.params.id,
		]);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Product not found" });
		}

		return res.status(204).send();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

productsRouter.get("/search", async (req, res) => {
	try {
		const q = `%${req.query.q || ""}%`;
		const [rows] = await pool.query(
			"SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
			[q, q]
		);
		return res.json({ total: rows.length, results: rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});
