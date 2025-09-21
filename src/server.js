import dotenv from "dotenv";

dotenv.config();
import app from "./app.js";
import pool from "./db.js";
const port = process.env.PORT || 3000;

async function start() {
	try {
		const [rows] = await pool.query("SELECT 1+1 AS result");
		console.log("DB connected, sanity check:", rows[0].result);
		app.listen(port, () =>
			console.log(`Server listening on http://localhost:${port}`)
		);
	} catch (e) {
		console.error("Failed to start server:", e);
		process.exit(1);
	}
}
start();
