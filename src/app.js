import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import api from "./api/index.js";
import * as middlewares from "./middlewares.js";
import initDB from "./models/index.js"; // Sequelize sync

dotenv.config();

const app = express();

// Middleware setup
app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

// API routes
app.use("/api/v1", api);

// Error handling
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// Initialize DB
initDB(); // Sync Sequelize models

export default app;