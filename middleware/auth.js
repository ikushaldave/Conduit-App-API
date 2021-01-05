const jwt = require("jsonwebtoken");

const User = require("../models/User");

module.exports = {
  verifyUserLoggedIn: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const payload = await jwt.verify(token, process.env.SECRET);
      req.userID = payload.userID
      next()
    } catch (error) {
      return next({ message: "Authentication is Required" , error, status: 401 });
    }
  }
}