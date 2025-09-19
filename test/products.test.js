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


describe("/api/v1/products search", () => {
  it("returns 400 when q is missing or invalid", async () => {
    const missing = await request(app).get("/api/v1/products/search");
    expect(missing.status).toBe(400);

    const badPageZero = await request(app).get("/api/v1/products/search").query({ q: "abc", page: 0 });
    expect(badPageZero.status).toBe(400);

    const badPageNaN = await request(app).get("/api/v1/products/search").query({ q: "abc", page: "nope" });
    expect(badPageNaN.status).toBe(400);
  });

  it("returns message when no products found", async () => {
    await request(app).post("/api/v1/products").send({ name: randomString(), description: randomString(20), price: randomPrice() });
    const res = await request(app).get("/api/v1/products/search").query({ q: "zzzz-no-match" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("No products found");
    expect(res.body.results).toEqual([]);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.total).toBe(0);
  });

  it("performs case-insensitive substring match and orders by created_at desc", async () => {
    const a = await request(app).post("/api/v1/products").send({ name: "Laptop Bag", description: randomString(20), price: 50 });
    const b = await request(app).post("/api/v1/products").send({ name: "lapTOP Stand", description: randomString(20), price: 30 });
    const c = await request(app).post("/api/v1/products").send({ name: "Phone", description: randomString(20), price: 999 });
    expect(a.status).toBe(201); expect(b.status).toBe(201); expect(c.status).toBe(201);
    const res = await request(app).get("/api/v1/products/search").query({ q: "laptop" });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.results.length).toBe(2);
    // newest first
    expect(res.body.results[0].id).toBe(b.body.id);
    expect(res.body.results[1].id).toBe(a.body.id);
  });

  it("paginates results with 10 per page", async () => {
    const createdIds = [];
    for (let i = 0; i < 15; i++) {
      const res = await request(app).post("/api/v1/products").send({ name: `Gadget ${i}`, description: randomString(20), price: randomPrice() });
      expect(res.status).toBe(201);
      createdIds.push(res.body.id);
    }
    const page1 = await request(app).get("/api/v1/products/search").query({ q: "gAdGet", page: 1 });
    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(15);
    expect(page1.body.page).toBe(1);
    expect(page1.body.pageSize).toBe(10);
    expect(page1.body.results.length).toBe(10);

    const page2 = await request(app).get("/api/v1/products/search").query({ q: "gAdGet", page: 2 });
    expect(page2.status).toBe(200);
    expect(page2.body.total).toBe(15);
    expect(page2.body.page).toBe(2);
    expect(page2.body.results.length).toBe(5);
  });

  it("escapes SQL LIKE metacharacters % and _", async () => {
    const p1 = await request(app).post("/api/v1/products").send({ name: "100% Cotton Shirt", description: randomString(20), price: 19.99 });
    const p2 = await request(app).post("/api/v1/products").send({ name: "Under_score Item", description: randomString(20), price: 9.99 });
    expect(p1.status).toBe(201); expect(p2.status).toBe(201);

    const s1 = await request(app).get("/api/v1/products/search").query({ q: "%" });
    expect(s1.status).toBe(200);
    // Should at least include the item with a literal % in the name
    expect(s1.body.results.some(r => r.id === p1.body.id)).toBe(true);

    const s2 = await request(app).get("/api/v1/products/search").query({ q: "_" });
    expect(s2.status).toBe(200);
    // Should at least include the item with a literal _ in the name
    expect(s2.body.results.some(r => r.id === p2.body.id)).toBe(true);
  });
});


