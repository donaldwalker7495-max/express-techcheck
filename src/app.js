import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./api";
import { notFound, errorHandler } from "./middlewares";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
	res.json({ message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄" });
});

app.get("/api/v1/emojis", (req, res) => {
	res.json(["😀", "😳", "🙄"]);
});

app.use("/api/v1", router);

app.use(notFound);
app.use(errorHandler);

export default app;
