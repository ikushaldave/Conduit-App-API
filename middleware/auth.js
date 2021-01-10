const jwt = require("jsonwebtoken");

module.exports = {
  verifyUserLoggedIn: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const payload = await jwt.verify(token, process.env.SECRET);
      req.userID = payload.userID
      next()
    } catch (error) {
      let detail = "Unauthorized requests";
      let status = 401;
      let errorCode = "auth-00";
      return next(customError(errorCode, detail, error.message, status));
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
      let detail = "token malformed or invalid";
      let status = 401;
      let errorCode = "auth-00";
      return next(customError(errorCode, detail, error.message, status));
    }
  }
}

function customError(errorCode, detail, message, status) {
	return {
		message,
		status,
    detail,
    errorCode,
	};
}