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
    const token = req.headers.authorization;
    res.status(200).type("application/json").json({ "user": {...userInfo(user, token)} })
  } catch (error) {
    
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
    return next({ message: "Something Went Wrong Creating New User", error, status: 500})
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
        throw new Error("Please Check a Email & Password")
      }
    } else {
      throw new Error("InValid User and Password")
    }
  } catch (error) {
    return next({ message: "Something Went Wrong", error, status: 401 });
  }

})

/* PUT /api/user/ */

router.put("/", auth.verifyUserLoggedIn, async (req, res, next) => {
  const users = req.body.users
  const token = req.headers.authorization;
  try {
    if (users.email || users.username || users.password || users.image || users.bio) {
      if (users.password) {
        users.local= {
          password: await hashPassword(users.password)
        }
      }
      const user = await User.findByIdAndUpdate(req.userID, users, { new:true, useFindAndModify: false })
      res.status(202).type("application/json").json({ "user": {...userInfo(user, token) }})
    } else {
      throw new Error("Updating for Following Invalid")
    }
  } catch (error) {
    return next({ message: "No Content" , error, status: 204})
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

module.exports = router;
