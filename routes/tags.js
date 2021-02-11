const express = require("express");
const router = express.Router();

const Article = require("../models/Article");

const customError = require("../modules/custom-error");

/* GET /api/tags */

router.get("/", async (req, res, next) => {
  try {
    const tags = await Article.distinct("tagList");
    res.status(200).type("application/json").json({ tags})
  } catch (error) {
    let detail = "something went wrong please try again";
    let message = " Internal Server Error ";
    let errorCode = "server-01";
    next(customError(message, detail, message));
  }
})

module.exports = router