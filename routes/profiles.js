const express = require("express");
const router = express.Router();

const User = require("../models/User");

const auth = require("../middleware/auth");

/* GET /api/profiles/:username */

router.get("/:username", async (req, res, next) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username })
    if (user) {
      res.status(200).type("application/json").json({ profile: { ...profile(user, req.userID) }})
    } else {
      throw new Error("User Not Found")
    }
  } catch (error) {
    next({message: "Not Found", error, status: 404})
  }
})

/* POST /api/profiles/:username/follow */

router.post("/:username/follow", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
    const isUserInDB = await User.findOne({ username });
    if (isUserInDB) {
      const currentUser = await User.findById(req.userID)
      const isCurrentUserAlreadyFollowing = currentUser.followings.includes(isUserInDB.id)
      if (isCurrentUserAlreadyFollowing) {
        res.status(200).type("application/json").json({ profile: {...profile(currentUser, req.userID) }})
      } else {
        const followingUser = await User.findOneAndUpdate({ username: username.toLocaleLowerCase() }, { $push: { followers: req.userID } }, { new: true, useFindAndModify: false });
        const currentUser = await User.findByIdAndUpdate(req.userID, { $push: { followings: followingUser.id } }, { new: true, useFindAndModify: false })
        res.status(202).type("application/json").json({ profile: { ...profile(currentUser, req.userID) } });
      }
    } else {
      throw new Error("User Not Found")
    }
  } catch (error) {
    next({ message: "Something Went Wrong Please try Again", error, status: 404 })
  }
});

/* DELETE /api/profiles/:username/follow */

router.delete("/:username/follow", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
    const isUserInDB = await User.findOne({ username });
    if (isUserInDB) {
      const currentUser = await User.findById(req.userID).populate("followings");
      const isCurrentUserFollowing = currentUser.followings.includes(isUserInDB.id);
      if (isCurrentUserFollowing) {
        const followingUser = await User.findByIdAndUpdate(isUserInDB.id, { $pull: { followers: req.userID } }, { new: true, useFindAndModify: false });
        const currentUser = await User.findByIdAndUpdate(req.userID, { $pull: { followings: isUserInDB.id } }, { new: true, useFindAndModify: false });
        res.status(202).type("application/json").json({ profile: { ...profile(currentUser, req.userID) } });
      } else {
        res.status(200).type("application/json").json({ profile: { ...profile(currentUser, req.userID) } });
      }
    } else {
      throw new Error("User Not Found");
    }
  } catch (error) {
    next({ message: "Something Went Wrong Please try Again", error, status: 404 });
  }
})

/* GET /api/profiles/:username/following */

router.get("/:username/followings", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
    const isUserInDB = await User.findOne({ username })
    if (isUserInDB) {
      const user = await User.findOne({ username }).populate("followings");
      res.status(200).type("application/json").json(user.followings.map((follow) => profile(follow, req.userID)))
    } else {
      throw new Error("Page Not Found")
    }
  } catch (error) {
    next({ message: "Something Went Wrong Please try Again", error, status: 500 })
  }
});

/* GET /api/profiles/:username/follower */

router.get("/:username/followers", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
		const isUserInDB = await User.findOne({ username });
		if (isUserInDB) {
			const user = await User.findOne({ username }).populate("followers");
			res.status(200).type("application/json").json(user.followers.map((follow) => profile(follow, req.userID)));
		} else {
			throw new Error("Page Not Found");
		}
  } catch (error) {
		next({ message: "Something Went Wrong Please try Again", error, status: 500 });
  }
});

function profile (user, loggedUserID = null) {
  const isLoggedUserIsFollowing = user.followings.includes(loggedUserID);
  const isLoggedUserIsFollower = user.followers.includes(loggedUserID);
  return {
		username: user.username,
		bio: user.bio,
    image: user.image,
    following: isLoggedUserIsFollowing,
    follower: isLoggedUserIsFollower,
		followings: `/api/profiles/${user.username}/followings`,
		followers: `/api/profiles/${user.username}/followers`,
  };
}

module.exports = router;