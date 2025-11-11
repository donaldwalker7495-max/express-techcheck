import db from "./db.js";

export const getAllProducts = async () => {
  const [rows] = await db.query("SELECT * FROM products");
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
  return rows[0];
};

export const createProduct = async (product) => {
  const { name, description, price } = product;
  const [result] = await db.query(
    "INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
    [name, description, price]
  );
  return { id: result.insertId, ...product, created_at: new Date() };
};

export const updateProduct = async (id, product) => {
  const { name, description, price } = product;
  await db.query(
    "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?",
    [name, description, price, id]
  );
  return { id, ...product };
};

export const deleteProduct = async (id) => {
  await db.query("DELETE FROM products WHERE id = ?", [id]);
};

export const searchProducts = async (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const searchQuery = `%${query}%`;
  const [rows] = await db.query(
    "SELECT * FROM products WHERE name LIKE ? LIMIT ? OFFSET ?",
    [searchQuery, limit, offset]
  );
  return rows;
};

export const getSearchCount = async (query) => {
  const searchQuery = `%${query}%`;
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) as count FROM products WHERE name LIKE ?",
    [searchQuery]
  );
  return count;
};
