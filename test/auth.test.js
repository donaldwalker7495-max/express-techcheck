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

beforeAll(async () => {
  await waitForDb();
  await migrate();
}, 180000);

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await query("TRUNCATE TABLE login_attempts RESTART IDENTITY");
  await query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
});

describe("/api/v1/auth", () => {
  it("registers new user and prevents duplicates", async () => {
    const username = `u_${randomString()}`;
    const password = `P@ssw0rd_${randomString(6)}`;
    const reg = await request(app).post("/api/v1/auth/register").send({ username, password });
    expect(reg.status).toBe(201);
    expect(reg.body.username).toBe(username);
    const dup = await request(app).post("/api/v1/auth/register").send({ username, password });
    expect(dup.status).toBe(409);
  });

  it("logs in with valid credentials and returns JWT", async () => {
    const username = `u_${randomString()}`;
    const password = `P@ssw0rd_${randomString(6)}`;
    const reg = await request(app).post("/api/v1/auth/register").send({ username, password });
    expect(reg.status).toBe(201);
    const login = await request(app).post("/api/v1/auth/login").send({ username, password });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");
  });

  it("rejects access to protected without token, accepts with token", async () => {
    const noAuth = await request(app).post("/api/v1/auth/protected");
    expect(noAuth.status).toBe(401);

    const username = `u_${randomString()}`;
    const password = `P@ssw0rd_${randomString(6)}`;
    await request(app).post("/api/v1/auth/register").send({ username, password });
    const login = await request(app).post("/api/v1/auth/login").send({ username, password });
    const token = login.body.token;
    const ok = await request(app).post("/api/v1/auth/protected").set("Authorization", `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.ok).toBe(true);
  });

  it("rate limits repeated failed logins and allows after window", async () => {
    const username = `u_${randomString()}`;
    const password = `P@ssw0rd_${randomString(6)}`;
    await request(app).post("/api/v1/auth/register").send({ username, password });

    for (let i = 0; i < 5; i++) {
      const bad = await request(app).post("/api/v1/auth/login").send({ username, password: "wrong" });
      expect(bad.status).toBe(401);
    }
    const limited = await request(app).post("/api/v1/auth/login").send({ username, password: "wrong" });
    expect(limited.status).toBe(429);
  });
});


