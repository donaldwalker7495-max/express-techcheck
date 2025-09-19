import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../src/app.js";
import { migrate, pool, query } from "../src/db.js";

async function waitForDb(retries = 120, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await query("SELECT 1");
      return;
    }
    catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Database not ready in time");
}

function randomString(len = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function randomPrice() {
  return Math.round((Math.random() * 1000 + Math.random()) * 100) / 100; // 0.00 - 1000.99
}

beforeAll(async () => {
  await waitForDb();
  await migrate();
}, 180000);

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await query("TRUNCATE TABLE products RESTART IDENTITY");
});

describe("/api/v1/products CRUD", () => {
  it("GET list initially empty", async () => {
    const res = await request(app).get("/api/v1/products").set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST creates product and returns 201 with payload", async () => {
    const payload = { name: randomString(), description: randomString(20), price: randomPrice() };
    const res = await request(app).post("/api/v1/products").send(payload).set("Accept", "application/json");
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: payload.name, description: payload.description });
    expect(typeof res.body.id).toBe("number");
    expect(typeof res.body.price).toBe("number");
    expect(res.body.created_at).toBeTruthy();
  });

  it("GET list returns created items ordered by created_at desc", async () => {
    const a = await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: randomPrice() });
    const b = await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: randomPrice() });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].id).toBe(b.body.id);
    expect(res.body[1].id).toBe(a.body.id);
  });

  it("GET by id returns the product, 404 for missing, 400 for invalid id", async () => {
    const created = await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: randomPrice() });
    const good = await request(app).get(`/api/v1/products/${created.body.id}`);
    expect(good.status).toBe(200);
    expect(good.body.id).toBe(created.body.id);

    const missing = await request(app).get("/api/v1/products/999999");
    expect(missing.status).toBe(404);

    const bad = await request(app).get("/api/v1/products/abc");
    expect(bad.status).toBe(400);
  });

  it("PUT updates provided fields only", async () => {
    const created = await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: 10 });
    expect(created.status).toBe(201);
    const newName = randomString();
    const res = await request(app).put(`/api/v1/products/${created.body.id}`).send({ name: newName });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.description).toBe(created.body.description);
    expect(res.body.price).toBe(10);
  });

  it("PUT returns 400 for invalid id and 404 when not found", async () => {
    const badId = await request(app).put("/api/v1/products/abc").send({ name: "x" });
    expect(badId.status).toBe(400);
    const notFound = await request(app).put("/api/v1/products/999999").send({ name: "y" });
    expect(notFound.status).toBe(404);
  });

  it("DELETE removes product and returns 204; subsequent GET 404", async () => {
    const created = await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: randomPrice() });
    const del = await request(app).delete(`/api/v1/products/${created.body.id}`);
    expect(del.status).toBe(204);
    const getAfter = await request(app).get(`/api/v1/products/${created.body.id}`);
    expect(getAfter.status).toBe(404);
  });

  it("Validation: POST requires fields and non-negative price", async () => {
    const missing = await request(app).post("/api/v1/products").send({});
    expect(missing.status).toBe(400);
    const negative = await request(app).post("/api/v1/products").send({ name: "a", description: "b", price: -1 });
    expect(negative.status).toBe(400);
  });
});


