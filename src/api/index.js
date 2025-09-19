import express from "express";
import checkSwaggerCli from "swagger-cli-express";

import emojis from "./emojis.js";
import auth from "./auth.js";
import products from "./products.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

checkSwaggerCli();

router.use("/emojis", emojis);
router.use("/products", products);
router.use("/auth", auth);

export default router;
