const jwt = require("jsonwebtoken");

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
  },
  currentLoggedUserInfo: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (token) {
        const payload = await jwt.verify(token, process.env.SECRET);
        req.userID = payload.userID;
      }
      next();
    } catch (error) {
      return next({ message: "Something Went Wrong", error, status: 500 });
    }
  }
}