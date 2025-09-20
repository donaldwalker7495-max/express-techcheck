const express = require("express");
const productsController = require("./controller");
const productValidation = require("./validation");

const router = express.Router();

router.get(
  "/search",
  productValidation.search,
  productsController.searchProducts
);
router.get("/", productsController.getAllProducts);
router.get(
  "/:id",
  productValidation.getById,
  productsController.getProductById
);
router.post("/", productValidation.create, productsController.createProduct);
router.put("/:id", productValidation.update, productsController.updateProduct);
router.delete(
  "/:id",
  productValidation.delete,
  productsController.deleteProduct
);

module.exports = router;
