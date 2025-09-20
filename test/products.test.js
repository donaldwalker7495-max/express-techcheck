import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import { env } from "../src/env.js";
import app from "../src/app.js";
import pool from "../src/db/connection.js";

describe("Products API", () => {
  let createdProductId;
  let authToken;

  beforeAll(async () => {
    // Register a test user and get auth token
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        password: "testpass123",
      });
    authToken = registerResponse.body.token;
  });

  it("should create a new product", async () => {
    const response = await request(app)
      .post("/api/products")
      .send({
        name: "Test Product",
        description: "Test Description",
        price: 99.99,
      })
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Product");
    createdProductId = response.body.id;
  });

  it("should get all products", async () => {
    const response = await request(app).get("/api/products").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should get a specific product", async () => {
    const response = await request(app)
      .get(`/api/products/${createdProductId}`)
      .expect(200);

    expect(response.body.id).toBe(createdProductId);
    expect(response.body.name).toBe("Test Product");
  });

  it("should update a product", async () => {
    const response = await request(app)
      .put(`/api/products/${createdProductId}`)
      .send({
        name: "Updated Product",
        price: 149.99,
      })
      .expect(200);

    expect(response.body.name).toBe("Updated Product");
    expect(response.body.price).toBe("149.99");
  });

  it("should search products", async () => {
    const response = await request(app)
      .get("/api/products/search?q=Updated")
      .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should delete a product", async () => {
    await request(app).delete(`/api/products/${createdProductId}`).expect(204);
  });
});

describe("Authentication API", () => {
  const testUser = {
    username: "testuser2",
    password: "testpass123",
  };

  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty(
      "message",
      "User registered successfully"
    );
  });

  it("should login a user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send(testUser)
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("message", "Login successful");
  });

  it("should access protected route with valid token", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(testUser);

    const response = await request(app)
      .post("/api/auth/protected")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Access granted to protected route"
    );
    expect(response.body).toHaveProperty("user");
  });

  it("should reject protected route access without token", async () => {
    await request(app).post("/api/auth/protected").expect(401);
  });

  it("should handle rate limiting", async () => {
    // Try to login 6 times in quick succession
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send(testUser);
    }

    // The 6th request should be rate limited
    const response = await request(app)
      .post("/api/auth/login")
      .send(testUser)
      .expect(429);

    expect(response.body).toHaveProperty("error");
  });
});
