const express = require("express");
const router = express.Router();

const Article = require("../models/Article");

/* GET /api/tags */

router.get("/", async (req, res, next) => {
  try {
    const tags = await Article.distinct("tagList");
    res.status(200).type("application/json").json({ tags})
  } catch (error) {
    
  }
})

module.exports = router