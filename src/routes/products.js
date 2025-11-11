import * as productModel from "../models/productModel.js";
import { validateProduct } from "../middleware/validation.js";

import { Router } from "express";
const router = Router();

router.get("/search", async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  if (!q)
    return res.status(400).json({ message: "Query parameter q is required" });

  try {
    const products = await productModel.searchProducts(
      q.toLowerCase(),
      parseInt(page),
      parseInt(limit)
    );
    const total = await productModel.getSearchCount(q.toLowerCase());
    if (products.length === 0) return res.json({ message: "No results found" });
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", validateProduct, async (req, res) => {
  try {
    const product = await productModel.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", validateProduct, async (req, res) => {
  try {
    const existing = await productModel.getProductById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Product not found" });
    const updated = await productModel.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await productModel.getProductById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Product not found" });
    await productModel.deleteProduct(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
