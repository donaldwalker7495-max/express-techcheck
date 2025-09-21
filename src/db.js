import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool;

export async function getPool() {
	if (process.env.NODE_ENV === "test") {
		const { getDb } = await import("../test/helpers/db.js");
		return getDb();
	}

	if (!pool) {
		pool = mysql.createPool({
			host: env.MYSQL_HOST,
			port: env.MYSQL_PORT,
			user: env.MYSQL_USER,
			password: env.MYSQL_PASSWORD,
			database: env.MYSQL_DB,
			waitForConnections: true,
			connectionLimit: 10,
		});
	}
	return pool;
}
