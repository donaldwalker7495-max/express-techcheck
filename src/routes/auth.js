import { Router } from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "./schema.js";
import bcrypt from "bcryptjs";
import { env } from "../env.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
	try {
		const { username, password } = registerSchema.parse(req.body);

		const [rows] = await pool.query("SELECT * FROM users WHERE username=?", [
			username,
		]);
		if (rows.length > 0) {
			return res.status(409).json({ error: "User already exists" });
		}

		const hashed = await bcrypt.hash(password, 10); // 👈 hash before storing
		await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [
			username,
			hashed,
		]);

		return res.status(201).json({ message: "User created" });
	} catch (err) {
		if (err.name === "ZodError") {
			return res.status(400).json({ error: err.errors });
		}
		return res.status(500).json({ error: "Internal server error" });
	}
});

authRouter.post("/login", async (req, res) => {
	try {
		const { username, password } = loginSchema.parse(req.body);

		const [rows] = await pool.query("SELECT * FROM users WHERE username=?", [
			username,
		]);
		if (rows.length === 0) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const user = rows[0];
		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ id: user.id, username: user.username },
			env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		return res.json({ token });
	} catch (err) {
		if (err.name === "ZodError") {
			console.log(err);
			return res.status(400).json({ error: err.errors });
		}
		return res.status(500).json({ error: "Internal server error" });
	}
});

authRouter.get("/protected", (req, res) => {
	const auth = req.headers.authorization;
	if (!auth) {
		return res.status(401).json({ error: "No token" });
	}
	return res.json({ message: "Access granted" });
});
