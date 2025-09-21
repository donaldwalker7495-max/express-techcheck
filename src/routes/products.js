import { Router } from "express";
import pool from "../db.js";
import { productSchema } from "./schema.js";

export const productsRouter = Router();

productsRouter.get("/search", async (req, res) => {
	try {
		const q = `%${req.query.q || ""}%`;
		console.log(q);
		const [rows] = await pool.query(
			"SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
			[q, q]
		);
		return res.json({ total: rows.length, results: rows });
	} catch (err) {
		return res.status(500).json({ error: "Internal server error" });
	}
});

productsRouter.post("/", async (req, res) => {
	try {
		const { name, description, price } = productSchema.parse(req.body);

		const [result] = await pool.query(
			"INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
			[name, description || null, price]
		);

		return res
			.status(201)
			.json({ id: result.insertId, name, description, price });
	} catch (err) {
		if (err.name === "ZodError") {
			return res.status(400).json({ error: err.errors });
		}
		return res.status(500).json({ error: "Internal server error" });
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
		return res.status(500).json({ error: "Internal server error" });
	}
});

productsRouter.put("/:id", async (req, res) => {
	try {
		let { name, description, price } = productSchema.partial().parse(req.body);

		const [rows] = await pool.query("SELECT * FROM products WHERE id=?", [
			req.params.id,
		]);

		if (rows.length === 0) {
			return res.status(404).json({ error: "Product not found" });
		}

		const prod = rows[0];

		const fieldsToUpdate = [];
		if (name) {
			fieldsToUpdate.push(name);
		} else {
			name = prod.name;
			fieldsToUpdate.push(name);
		}

		if (description) {
			fieldsToUpdate.push(description);
		} else {
			description = prod.description;
			fieldsToUpdate.push(description);
		}

		if (price) {
			fieldsToUpdate.push(price);
		} else {
			price = prod.price;
			fieldsToUpdate.push(price);
		}

		await pool.query(
			"UPDATE products SET name=?, description=?, price=? WHERE id=?",
			[...fieldsToUpdate, req.params.id]
		);

		const [updated] = await pool.query("SELECT * FROM products WHERE id=?", [
			req.params.id,
		]);

		if (updated.length === 0) {
			return res.status(404).json({ error: "Product not found" });
		}

		return res.json(updated[0]);
	} catch (err) {
		if (err.name === "ZodError") {
			return res.status(400).json({ error: err.errors });
		}
		console.log(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

productsRouter.delete("/:id", async (req, res) => {
	try {
		await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
		return res.status(204).send();
	} catch (err) {
		return res.status(500).json({ error: "Internal server error" });
	}
});

