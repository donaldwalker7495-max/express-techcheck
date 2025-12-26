# API Documentation

This Express.js API provides endpoints for product management and user authentication with JWT tokens.

## Base URL
```
http://localhost:3000/api/v1
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3000 by default.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a Bearer token in the Authorization header.

### Headers for Protected Routes
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## API Endpoints

### 1. Products API

#### Get All Products
- **GET** `/api/v1/products`
- **Description**: Retrieve all products
- **Authentication**: None required

**Example Request:**
```bash
curl http://localhost:3000/api/v1/products
```

**Example Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance laptop for work and gaming",
      "price": 999.99,
      "created_at": "2024-01-01 10:00:00"
    }
  ],
  "count": 1
}
```

#### Get Product by ID
- **GET** `/api/v1/products/:id`
- **Description**: Retrieve a specific product by its ID
- **Authentication**: None required

**Example Request:**
```bash
curl http://localhost:3000/api/v1/products/1
```

#### Create New Product
- **POST** `/api/v1/products`
- **Description**: Add a new product
- **Authentication**: None required
- **Validation**: name, description (required), price (positive number)

**Request Body:**
```json
{
  "name": "Gaming Mouse",
  "description": "High-DPI gaming mouse with RGB lighting",
  "price": 79.99
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Gaming Mouse","description":"High-DPI gaming mouse","price":79.99}'
```

#### Update Product
- **PUT** `/api/v1/products/:id`
- **Description**: Update a product's information
- **Authentication**: None required

**Request Body (partial updates allowed):**
```json
{
  "name": "Updated Product Name",
  "price": 89.99
}
```

#### Delete Product
- **DELETE** `/api/v1/products/:id`
- **Description**: Delete a product by its ID
- **Authentication**: None required

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/products/1
```

#### Search Products
- **GET** `/api/v1/products/search?q=<query>&page=<page>`
- **Description**: Search products by name (case-insensitive)
- **Authentication**: None required
- **Query Parameters:**
  - `q`: Search query (required)
  - `page`: Page number for pagination (optional, default: 1)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/products/search?q=laptop&page=1"
```

**Example Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "description": "High-performance laptop for work and gaming",
      "price": 999.99,
      "created_at": "2024-01-01 10:00:00"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 1,
    "limit": 10
  }
}
```

### 2. Authentication API

#### Register User
- **POST** `/api/v1/auth/register`
- **Description**: Register a new user
- **Authentication**: None required
- **Validation**: username (3-50 chars), password (6-100 chars)

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"securepassword123"}'
```

**Example Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

#### Login User
- **POST** `/api/v1/auth/login`
- **Description**: Authenticate user and receive JWT token
- **Authentication**: None required
- **Rate Limiting**: 5 attempts per 15 minutes per IP

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"securepassword123"}'
```

**Example Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

#### Protected Route Example
- **POST** `/api/v1/auth/protected`
- **Description**: Example protected route that requires authentication
- **Authentication**: Required (JWT token)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "message": "This is a protected route!",
  "user": {
    "id": 1,
    "username": "johndoe"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Get User Profile
- **GET** `/api/v1/auth/profile`
- **Description**: Get current user's profile
- **Authentication**: Required (JWT token)

## Error Responses

The API returns standardized error responses:

```json
{
  "error": "Error description",
  "details": ["Validation error details (if applicable)"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (valid token but insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., username already exists)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Sample Usage Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

2. **Login to get JWT token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

3. **Use the token for protected routes:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/protected \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

4. **Create a new product:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"New Product","description":"Great product","price":29.99}'
```

5. **Search for products:**
```bash
curl "http://localhost:3000/api/v1/products/search?q=product"
```

## Features Implemented

✅ **Problem 1: CRUD Operations for Products**
- GET, POST, PUT, DELETE for products
- Input validation using Zod
- Proper error handling

✅ **Problem 2: User Authentication with JWT**
- User registration with password hashing
- JWT-based authentication
- Protected routes with middleware
- Rate limiting for login attempts

✅ **Problem 3: Product Search**
- Case-insensitive search by product name
- Pagination support
- SQLite database with LIKE queries

## Database

The application uses SQLite for simplicity. The database file (`database.sqlite`) is created automatically when the server starts. It includes:

- **products** table: id, name, description, price, created_at
- **users** table: id, username, password (hashed)

Sample data is automatically inserted for testing purposes.

## Security Features

- Password hashing with bcryptjs
- JWT tokens with expiration (24 hours)
- Rate limiting for login attempts
- Input validation for all endpoints
- SQL injection prevention with parameterized queries
