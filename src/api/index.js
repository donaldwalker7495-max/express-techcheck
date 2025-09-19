import express from "express";
import checkSwaggerCli from "swagger-cli-express";

import emojis from "./emojis.js";
import products from "./products.js";
import auth from "./auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
    endpoints: {
      products: "/api/v1/products",
      auth: "/api/v1/auth",
      emojis: "/api/v1/emojis"
    }
  });
});

checkSwaggerCli();

router.use("/emojis", emojis);
router.use("/products", products);
router.use("/auth", auth);

export default router;
