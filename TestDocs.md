Below is a comprehensive yet beginner-friendly **testing documentation** for the **Express Starter Project**, which includes **Product CRUD Operations**, **JWT Authentication with Rate-Limiting**, and **Case-Insensitive Product Search with Pagination**. This document is designed for someone new to testing APIs, providing clear instructions, curl commands, and expected outcomes to verify all functionalities. It assumes the project is set up as described (Node.js v23.5.0, ES Modules, MySQL, Express) and running at `http://localhost:3000`. The document covers all endpoints, bonuses (Joi validation, rate-limiting), and common debugging tips, making it easy for a beginner to test the project thoroughly.

---

# Testing Documentation for Express Starter Project

This guide helps you test the **Express Starter Project**, a REST API built with Express.js and MySQL. The project includes:
- **Product CRUD**: Create, read, update, and delete products.
- **User Authentication**: Register, login, and access protected routes with JWT.
- **Product Search**: Search products by name with pagination.
- **Bonuses**: Input validation (Joi) and login rate-limiting.

You’ll use **curl** commands to test each endpoint. If you prefer a GUI tool, you can use **Postman** (instructions included). This document assumes the server is running and the database is set up.

## Prerequisites
1. **Node.js**: Version 23.5.0 or higher.
2. **MySQL**: Installed and running.
3. **Project Setup**:
   - Directory: `/home/BlueCoin/express-techcheck/`.
   - Dependencies installed: `npm install`.
   - `.env` file in the project root:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_db_password
     DB_NAME=express_db
     JWT_SECRET=your_secure_jwt_secret_here
     ```
     Generate a secure `JWT_SECRET`:
     ```bash
     openssl rand -hex 32
     ```
4. **Database Setup**:
   Log into MySQL:
   ```bash
   mysql -u root -p -h localhost
   ```
   Enter password (`your_db_password`), then create the database and tables:
   ```sql
   CREATE DATABASE express_db;
   USE express_db;
   CREATE TABLE products (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     description TEXT NOT NULL,
     price DECIMAL(10, 2) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );
   ```
5. **Start the Server**:
   ```bash
   cd /home/BlueCoin/express-techcheck
   npm start
   ```
   Expected output:
   ```
   Server running on port 3000
   Database connection successful
   ```

## Testing Tools
- **curl**: Command-line tool for sending HTTP requests (included below).
- **Postman** (optional):
  - Download: https://www.postman.com/
  - Set method (GET/POST/etc.), URL, headers (`Content-Type: application/json` for POST/PUT), and raw JSON body.
- **Terminal**: To run curl commands and view server logs.
- **MySQL**: To check data directly if needed.

## Test Plan
We’ll test all endpoints in the following order:
1. **Product CRUD** (Problem 1):
   - GET `/api/products`
   - GET `/api/products/:id`
   - POST `/api/products`
   - PUT `/api/products/:id`
   - DELETE `/api/products/:id`
2. **User Authentication** (Problem 2):
   - POST `/api/auth/register`
   - POST `/api/auth/login`
   - POST `/api/auth/protected`
   - Rate-limiting test for login
3. **Product Search** (Problem 3):
   - GET `/api/products/search`

Each test includes a curl command, expected response, and error cases to verify functionality and validation.

---

## 1. Product CRUD Endpoints

### 1.1 GET `/api/products` - Retrieve All Products
**Purpose**: Fetch all products from the database.
```bash
curl -X GET http://localhost:3000/api/products
```
**Expected Response** (200 OK):
- If products exist:
  ```json
  [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance gaming laptop",
      "price": 999.99,
      "created_at": "2025-09-19T14:41:00.000Z"
    }
  ]
  ```
- If no products: `[]` (empty array).

**Debug**:
- If 500 error (`{ "message": "Server error" }`):
  - Check server logs for database issues.
  - Verify `products` table exists: `SELECT * FROM products;` in MySQL.

### 1.2 GET `/api/products/:id` - Retrieve a Product by ID
**Purpose**: Fetch a specific product by its ID.
```bash
curl -X GET http://localhost:3000/api/products/1
```
**Expected Response** (200 OK):
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance gaming laptop",
  "price": 999.99,
  "created_at": "2025-09-19T14:41:00.000Z"
}
```
**Error Case** (404 Not Found):
```bash
curl -X GET http://localhost:3000/api/products/999
```
```json
{ "message": "Product not found" }
```

**Debug**:
- Ensure the ID exists in the `products` table.
- Check server logs for SQL errors.

### 1.3 POST `/api/products` - Create a New Product
**Purpose**: Add a product with validation (name ≥ 3 chars, description ≥ 10 chars, price > 0).
```bash
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{"name":"Smartphone","description":"Latest 5G model with OLED","price":699.99}'
```
**Expected Response** (201 Created):
```json
{
  "id": 2,
  "name": "Smartphone",
  "description": "Latest 5G model with OLED",
  "price": 699.99,
  "created_at": "2025-09-19T14:42:00.000Z"
}
```
**Error Case** (400 Bad Request, validation failure):
```bash
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{"name":"a","description":"short","price":-1}'
```
```json
{ "message": "\"name\" length must be at least 3 characters long" }
```

**Debug**:
- Ensure `Content-Type: application/json` is set.
- Verify JSON body is valid.
- Check server logs if 500 error occurs.

### 1.4 PUT `/api/products/:id` - Update a Product
**Purpose**: Update an existing product’s details.
```bash
curl -X PUT http://localhost:3000/api/products/1 \
-H "Content-Type: application/json" \
-d '{"name":"Updated Laptop","description":"Upgraded gaming laptop with RTX","price":1299.99}'
```
**Expected Response** (200 OK):
```json
{
  "id": 1,
  "name": "Updated Laptop",
  "description": "Upgraded gaming laptop with RTX",
  "price": 1299.99
}
```
**Error Case** (404 Not Found):
```bash
curl -X PUT http://localhost:3000/api/products/999 \
-H "Content-Type: application/json" \
-d '{"name":"Updated Laptop","description":"Upgraded gaming laptop","price":1299.99}'
```
```json
{ "message": "Product not found" }
```
**Error Case** (400 Bad Request, validation failure):
```bash
curl -X PUT http://localhost:3000/api/products/1 \
-H "Content-Type: application/json" \
-d '{"name":"a","description":"short","price":-1}'
```
```json
{ "message": "\"name\" length must be at least 3 characters long" }
```

**Debug**:
- Verify the ID exists: `SELECT * FROM products WHERE id = 1;` in MySQL.
- Ensure valid JSON and headers.

### 1.5 DELETE `/api/products/:id` - Delete a Product
**Purpose**: Remove a product by ID.
```bash
curl -X DELETE http://localhost:3000/api/products/1
```
**Expected Response** (200 OK):
```json
{ "message": "Product deleted" }
```
**Error Case** (404 Not Found):
```bash
curl -X DELETE http://localhost:3000/api/products/999
```
```json
{ "message": "Product not found" }
```

**Debug**:
- Confirm the ID exists before deletion.
- Check server logs for errors.

---

## 2. User Authentication Endpoints

### 2.1 POST `/api/auth/register` - Register a New User
**Purpose**: Create a user with a hashed password.
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","password":"password123"}'
```
**Expected Response** (201 Created):
```json
{
  "id": 1,
  "username": "testuser"
}
```
**Error Case** (400 Bad Request, username exists):
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","password":"password123"}'
```
```json
{ "message": "Username already exists" }
```
**Error Case** (400 Bad Request, validation failure):
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"a","password":"short"}'
```
```json
{ "message": "\"username\" length must be at least 3 characters long" }
```

**Debug**:
- Check server logs for `Request body:` or `Error in /register:`.
- Verify `users` table: `SELECT * FROM users;` in MySQL.
- Ensure `Content-Type: application/json`.

### 2.2 POST `/api/auth/login` - Login and Get JWT
**Purpose**: Authenticate a user and return a JWT token.
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"testuser","password":"password123"}'
```
**Expected Response** (200 OK):
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```
**Error Case** (401 Unauthorized):
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"testuser","password":"wrongpassword"}'
```
```json
{ "message": "Invalid credentials" }
```
**Error Case** (400 Bad Request, validation failure):
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"a","password":"short"}'
```
```json
{ "message": "\"username\" length must be at least 3 characters long" }
```

**Debug**:
- Save the JWT token for the next test.
- Check server logs for `Error in /login:`.
- Verify user exists in `users` table.

### 2.3 POST `/api/auth/protected` - Access Protected Route
**Purpose**: Test JWT authentication by accessing a protected route.
```bash
curl -X POST http://localhost:3000/api/auth/protected \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
**Expected Response** (200 OK):
```json
{
  "message": "Protected route accessed successfully",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```
**Error Case** (401 Unauthorized, no token):
```bash
curl -X POST http://localhost:3000/api/auth/protected
```
```json
{ "message": "No token provided" }
```
**Error Case** (403 Forbidden, invalid token):
```bash
curl -X POST http://localhost:3000/api/auth/protected \
-H "Authorization: Bearer invalid_token"
```
```json
{ "message": "Invalid token" }
```

**Debug**:
- Ensure the `Authorization` header format is `Bearer <token>`.
- Verify the token is valid and not expired (JWT expires in 1 hour).
- Check `JWT_SECRET` in `.env`.

### 2.4 Test Login Rate-Limiting
**Purpose**: Verify that login attempts are limited to 5 per minute.
```bash
# Run 6 times in a row
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrongpassword"}'
done
```
**Expected Response**:
- First 5 attempts: `{ "message": "Invalid credentials" }` (401).
- 6th attempt: `{ "message": "Too many login attempts, please try again later" }` (429).
- Wait 1 minute, then retry (should work again).

**Debug**:
- Check server logs for rate-limiting messages.
- Ensure `express-rate-limit` is installed (`npm install express-rate-limit`).

---

## 3. Product Search Endpoint

### 3.1 GET `/api/products/search` - Search Products by Name
**Purpose**: Search products by name (case-insensitive) with pagination.
```bash
curl -X GET "http://localhost:3000/api/products/search?q=laptop&page=1&limit=2"
```
**Expected Response** (200 OK):
```json
{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance gaming laptop",
      "price": 999.99,
      "created_at": "2025-09-19T14:41:00.000Z"
    },
    {
      "id": 3,
      "name": "Laptop Pro",
      "description": "Professional laptop",
      "price": 1299.99,
      "created_at": "2025-09-19T14:43:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 2,
    "totalPages": 1
  }
}
```
**Error Case** (400 Bad Request, missing query):
```bash
curl -X GET http://localhost:3000/api/products/search
```
```json
{ "message": "Query parameter q is required" }
```
**Error Case** (No results):
```bash
curl -X GET "http://localhost:3000/api/products/search?q=xyz"
```
```json
{ "message": "No results found" }
```

**Debug**:
- Test with different queries (e.g., `?q=lap`, `?q=PHONE`).
- Verify pagination by changing `page` and `limit`.
- Check `products` table for data.

---

## Postman Instructions
For beginners who prefer a GUI:
1. Open Postman and create a new request.
2. Set the method (GET/POST/PUT/DELETE) and URL (e.g., `http://localhost:3000/api/products`).
3. For POST/PUT:
   - Go to **Headers** → Add `Content-Type: application/json`.
   - Go to **Body** → Select `raw` → Choose `JSON` → Enter JSON (e.g., `{"name":"Smartphone","description":"Latest 5G model","price":699.99}`).
4. For `/api/auth/protected`:
   - Go to **Headers** → Add `Authorization: Bearer <token>` (use token from `/login`).
5. Send the request and check the response.

---

## Debugging Common Issues
1. **Server Not Running**:
   - Run `npm start` and check for `Server running on port 3000`.
   - If it fails, verify `node --env-file=.env src/index.js`.
2. **Database Connection Failed**:
   - Check `.env` credentials (`DB_USER=root`, `DB_PASSWORD=your_db_password`).
   - Test MySQL: `mysql -u root -p -h localhost`.
   - Ensure `express_db` exists: `SHOW DATABASES;` in MySQL.
3. **500 Server Error**:
   - Check server logs for errors (e.g., SQL issues).
   - Verify `products` and `users` tables exist.
4. **400 Validation Error**:
   - Ensure JSON body meets requirements (e.g., `name` ≥ 3 chars).
   - Check `Content-Type: application/json`.
5. **401/403 Auth Errors**:
   - Verify JWT token format (`Bearer <token>`).
   - Ensure `JWT_SECRET` matches in `.env`.
6. **Empty Responses**:
   - Populate `products` table:
     ```sql
     INSERT INTO products (name, description, price) VALUES
     ('Laptop', 'High-performance gaming laptop', 999.99),
     ('Smartphone', 'Latest 5G model', 699.99);
     ```

---

## Test Checklist
- [ ] **Product CRUD**:
  - [ ] GET `/api/products` returns products or empty array.
  - [ ] GET `/api/products/:id` returns a product or 404.
  - [ ] POST `/api/products` creates a product or validates input.
  - [ ] PUT `/api/products/:id` updates a product or returns 404/validation error.
  - [ ] DELETE `/api/products/:id` deletes a product or returns 404.
- [ ] **User Authentication**:
  - [ ] POST `/api/auth/register` creates a user or detects duplicates.
  - [ ] POST `/api/auth/login` returns a JWT or rejects invalid credentials.
  - [ ] POST `/api/auth/protected` allows valid tokens, rejects invalid/missing tokens.
  - [ ] Login rate-limiting blocks after 5 attempts.
- [ ] **Product Search**:
  - [ ] GET `/api/products/search` returns matching products with pagination or handles no results/missing query.

---

