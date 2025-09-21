import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getDb, resetTables } from "./helpers/db.js";

describe("Auth flow", () => {
	beforeEach(async () => {
		await getDb();
		await resetTables();
	});

	it("registers a new user", async () => {
		const res = await request(app).post("/api/auth/register").send({
			username: "alice",
			password: "hunter2",
		});
		expect(res.statusCode).toBe(201);
	});

	it("prevents duplicate registrations", async () => {
		await request(app).post("/api/auth/register").send({
			username: "alice",
			password: "hunter2",
		});
		const dup = await request(app).post("/api/auth/register").send({
			username: "alice",
			password: "another",
		});
		expect(dup.statusCode).toBe(409);
	});

	it("rejects wrong password", async () => {
		await request(app).post("/api/auth/register").send({
			username: "alice",
			password: "hunter2",
		});
		const res = await request(app).post("/api/auth/login").send({
			username: "alice",
			password: "wrong",
		});
		expect(res.statusCode).toBe(401);
	});

	it("logs in with correct credentials and protects routes", async () => {
		await request(app).post("/api/auth/register").send({
			username: "alice",
			password: "hunter2",
		});

		const login = await request(app).post("/api/auth/login").send({
			username: "alice",
			password: "hunter2",
		});
		expect(login.statusCode).toBe(200);
		expect(login.body.token).toBeDefined();

		const noTok = await request(app).get("/api/auth/protected");
		expect(noTok.statusCode).toBe(401);

		const ok = await request(app)
			.get("/api/auth/protected")
			.set("Authorization", `Bearer ${login.body.token}`);
		expect(ok.statusCode).toBe(200);
		expect(ok.body.message).toBe("Access granted");
	});
});
