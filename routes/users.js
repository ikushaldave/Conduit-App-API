var express = require('express');
var router = express.Router();

var User = require("../models/User");

var jwt = require("../middlewares/token")

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST  /api/users */

router.post("/", async (req, res, next) => {
  try {
    const user = await User.create({
      username: req.body.user.username,
      email: req.body.user.email,
      local: {
        password: req.body.user.password
      }
    });

    res.status(201).type("application/json").json({ "user": {...userInfo(user)} })
  } catch (error) {
    return next({ message: "Something Went Wrong Creating New User", error, status: 500})
  }
})


/* POST /api/users/login */

router.post("/login", async (req, res, next) => {
  
  try {

    if (req.body.users.email.trim() && req.body.users.password.trim()) {
      const user = await User.findOne({ email: req.body.users.email });
      const isPasswordValid = await user.validatePassword(req.body.users.password);
  
      if (isPasswordValid) {
        const token = await jwt.generateToken({ userID: user.id })
        res.status(200).type("application/json").json({ "user": {...userInfo(user), token }})
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

function userInfo (user) {
  return {
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image
  }
}

module.exports = router;
