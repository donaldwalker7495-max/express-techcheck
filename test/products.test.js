import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getDb, resetTables } from "./helpers/db.js";

describe("Products CRUD + search edges", () => {
	beforeEach(async () => {
		await getDb();
		await resetTables();
	});

	it("rejects invalid payloads", async () => {
		const res = await request(app).post("/api/products").send({});
		expect(res.statusCode).toBe(400);
	});

	it("creates, reads, updates, searches, and deletes a product", async () => {
		const create = await request(app).post("/api/products").send({
			name: "Laptop X",
			description: "Great dev machine",
			price: 1299.99,
		});
		expect(create.statusCode).toBe(201);
		const id = create.body.id;

		const read = await request(app).get(`/api/products/${id}`);
		expect(read.statusCode).toBe(200);
		expect(read.body.name).toBe("Laptop X");

		const update = await request(app)
			.put(`/api/products/${id}`)
			.send({ price: 1199.99 });
		expect(update.statusCode).toBe(200);
		expect(update.body.price).toBe(1199.99);

		const search = await request(app).get("/api/products/search?q=laptop");
		expect(search.statusCode).toBe(200);
		expect(search.body.total).toBe(1);

		const del = await request(app).delete(`/api/products/${id}`);
		expect(del.statusCode).toBe(204);

		const gone = await request(app).get(`/api/products/${id}`);
		expect(gone.statusCode).toBe(404);
	});

	it("returns 404 for non-existent product", async () => {
		const res = await request(app).get("/api/products/9999");
		expect(res.statusCode).toBe(404);
	});
});
