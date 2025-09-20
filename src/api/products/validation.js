const { body, param, query } = require("express-validator");

const productValidation = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Product name is required")
      .isLength({ max: 255 })
      .withMessage("Product name must be less than 255 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Product description is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
  ],
  update: [
    param("id").isInt({ min: 1 }).withMessage("Invalid product ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Product name cannot be empty")
      .isLength({ max: 255 })
      .withMessage("Product name must be less than 255 characters"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Product description cannot be empty"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
  ],
  getById: [param("id").isInt({ min: 1 }).withMessage("Invalid product ID")],
  delete: [param("id").isInt({ min: 1 }).withMessage("Invalid product ID")],
  search: [
    query("q").trim().notEmpty().withMessage("Search query is required"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
};

module.exports = productValidation;
