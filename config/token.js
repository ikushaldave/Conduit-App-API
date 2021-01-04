const jwt = require("jsonwebtoken");

module.exports = {
  generateToken: async (payload) => {
    try {
      const token = await jwt.sign(payload, process.env.SECRET);
      return token;
    } catch (error) {
      
    }
  }
}