const jwt = require("jsonwebtoken");

module.exports = {
  generateToken: async (payload) => {
    try {
      const token = await jwt.sign(payload, process.env.SECRET);
      return token;
    } catch (error) {
      
    }
  },
  validateToken: async (req, res, next) => {
    try {
      const payload = await jwt.verify(token, process.env.SECRET);
      return payload;
    } catch (error) {
      return next(error)
    }
  }
}