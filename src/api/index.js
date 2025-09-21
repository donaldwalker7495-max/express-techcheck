import express from "express";
import checkSwaggerCli from "swagger-cli-express";

import { productsRouter } from "../routes/products.js";
import { authRouter } from "../routes/auth.js";
import { authRequired } from "../middlewares";
import { limiter } from "./rate_limit.js";

export const router = express();

router
	.get("/", (req, res) => {
		res.json({
			message: "API - 👋🌎🌍🌏",
		});
	})
	.get("/emojis", (req, res) => {
		const emojis = ["😀", "😳", "🙄"];
		res.json(emojis);
	})
	.get("/health", (req, res) => res.json({ status: "ok" }))
	.post("/auth/protected", authRequired, (req, res) =>
		res.json({ message: "Access granted", user: req.user })
	)
	.use("/auth/login", limiter)
	.use("/auth", authRouter)
	.use("/products", productsRouter);

checkSwaggerCli();

router;
