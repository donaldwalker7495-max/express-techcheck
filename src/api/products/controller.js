const { validationResult } = require("express-validator");
const pool = require("../../db/connection");

const productsController = {
  async getAllProducts(req, res) {
    try {
      const [products] = await pool.query(
        "SELECT * FROM products ORDER BY created_at DESC"
      );
      res.json(products);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getProductById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      const [products] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(products[0]);
    } catch (error) {
      console.error("Error getting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async createProduct(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price } = req.body;
    try {
      const [result] = await pool.query(
        "INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
        [name, description, price]
      );

      const [product] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [result.insertId]
      );
      res.status(201).json(product[0]);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateProduct(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, price } = req.body;
    try {
      const [existingProduct] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updates = {
        name: name || existingProduct[0].name,
        description: description || existingProduct[0].description,
        price: price || existingProduct[0].price,
      };

      await pool.query(
        "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?",
        [updates.name, updates.description, updates.price, id]
      );

      const [updatedProduct] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      res.json(updatedProduct[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async deleteProduct(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async searchProducts(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const [products] = await pool.query(
        "SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [`%${q}%`, limit, offset]
      );

      const [[{ total }]] = await pool.query(
        "SELECT COUNT(*) as total FROM products WHERE name LIKE ?",
        [`%${q}%`]
      );

      const totalPages = Math.ceil(total / limit);

      res.json({
        data: products,
        pagination: {
          total,
          page,
          totalPages,
          limit,
        },
      });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = productsController;
