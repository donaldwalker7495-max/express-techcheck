# Express Starter Project - Candidate Check

## Problem 1: Implement CRUD Operations for a Product Resource

**Task**: Create a REST API for managing products. Each product has the following fields:

- `id` (unique identifier)
- `name` (string)
- `description` (string)
- `price` (number)
- `created_at` (timestamp)

### Requirements:

1. **GET** `/api/products`: Retrieve all products.
2. **GET** `/api/products/:id`: Retrieve a specific product by its ID.
3. **POST** `/api/products`: Add a new product (ensure data validation for `name`, `description`, and `price`).
4. **PUT** `/api/products/:id`: Update a product’s information.
5. **DELETE** `/api/products/:id`: Delete a product by its ID.

### Bonus:

- Add input validation using a library like `express-validator` or `joi`.

---

## Problem 2: Implement User Authentication with JWT

**Task**: Implement a simple authentication system for a user. Each user has:

- `id` (unique identifier)
- `username` (string)
- `password` (string, stored securely)

### Requirements:

1. **POST** `/api/auth/register`: Register a new user (hash the password before storing).
2. **POST** `/api/auth/login`: Authenticate a user and return a JWT token upon successful login.
3. **POST** `/api/auth/protected`: A protected route that requires JWT authorization to access (use middleware to verify the JWT token).

### Bonus:

- Implement user login rate-limiting (to prevent brute-force attacks).

---

## Problem 3: Implement Search for Products by Name

**Task**: Add a search functionality for products. Implement the following:

1. **GET** `/api/products/search`: Accept a `q` query parameter (for example, `/api/products/search?q=laptop`) and return all products whose `name` contains the query string.

### Requirements:

- The search should be case-insensitive.
- Use MySQL to perform the search (hint: `LIKE` queries).
- If no products are found, return a message indicating that no results were found.

### Bonus:

- Implement pagination for search results (e.g., limit the results to 10 products per page, and use query parameters like `page`).
