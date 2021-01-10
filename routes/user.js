var express = require('express');
var router = express.Router();

var User = require("../models/User");

var jwt = require("../config/token")
var auth = require("../middleware/auth")
var hashPassword = require("../modules/hashPassword")

/* GET /api/user */

router.get('/', auth.verifyUserLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.userID);
    if (user) {
      const token = req.headers.authorization;
      res.status(200).type("application/json").json({ "user": {...userInfo(user, token)} })
    } else {
      throw new Error("auth-01")
    }
  } catch (error) {
    let detail = "please re-login token malfunctioned";
    let message = "";
    let status = 400;
    let errorCode = error.message
    next(customError(error))
  }
});

/* POST  /api/user */

router.post("/", async (req, res, next) => {
  try {
    const user = await User.create({
      username: req.body.user.username,
      email: req.body.user.email,
      local: {
        password: req.body.user.password
      }
    });
    const token = await jwt.generateToken({ userID: user.id })
    res.status(201).type("application/json").json({ "user": {...userInfo(user, token)} })
  } catch (error) {
    let errorCode = "val-01";
    let detail = "username should minimum of length 6 & can contain '. - _' but can't start with these & others special character, email should be valid & password should contain minimum of 8 at least one capital, at least one digit, and at least one special character";
    let message = error._message;
    let status = 422;
    next(customError(errorCode, detail, message, status))
  }
})


/* POST /api/user/login */

router.post("/login", async (req, res, next) => {
  try {
    if (req.body.users.email.trim() && req.body.users.password.trim()) {
      const user = await User.findOne({ email: req.body.users.email });
      const isPasswordValid = await user.validatePassword(req.body.users.password);
      if (isPasswordValid) {
        const token = await jwt.generateToken({ userID: user.id })
        res.status(200).type("application/json").json({ "user": {...userInfo(user, token) }})
      } else {
        throw new Error("auth-02")
      }
    } else {
      throw new Error("val-02");
    }
  } catch (error) {
    let message = detail = null;
    if  (error.message == "auth-02") {
      message = "password is invalid";
      detail = "password doesn't match";
    } else {
      message = "email and password is required";
      detail = "valid email and correct password is required";
    }
    return next(customError(error.message, detail, message, 400));
  }

})

/* PUT /api/user/ */

router.put("/", auth.verifyUserLoggedIn, async (req, res, next) => {
  const user = req.body.user
  const token = req.headers.authorization;
  try {
    if (user.email || user.username || user.password || user.image || user.bio) {
      if (user.password) {
          user.local= {
              password: await hashPassword(user.password)
          }
        }
      const userModified = await User.findByIdAndUpdate(req.userID, user, { new: true, useFindAndModify: false })
      res.status(202).type("application/json").json({ "user": {...userInfo(userModified, token) }})
    } else {
      throw new Error("invalid-01")
    }
  } catch (error) {
    let detail = "no field updated due to invalid data passed";
    let message = "Not Accepted";
    let status = 406;
    next(customError(error.message, detail, message, status));
  }
})

function userInfo (user, token) {
  return {
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    token
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

module.exports = router;
