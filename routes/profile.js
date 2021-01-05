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
      res.status(200).type("application/json").json({ profile: { ...profile(user) }})
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
      const isCurrentUserAlreadyFollowing = currentUser.following.includes(isUserInDB.id)
      if (isCurrentUserAlreadyFollowing) {
        res.status(200).type("application/json").json({ profile: {...profile(currentUser) }})
      } else {
        const followingUser = await User.findOneAndUpdate({ username: username.toLocaleLowerCase() }, { $push: { follower: req.userID } }, { new: true, useFindAndModify: false });
        const currentUser = await User.findByIdAndUpdate(req.userID, { $push: { following: followingUser.id } }, { new: true, useFindAndModify: false })
        res.status(202).type("application/json").json({ profile: { ...profile(currentUser) } })
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
      const currentUser = await User.findById(req.userID);
      const isCurrentUserFollowing = currentUser.following.includes(isUserInDB.id);
      if (isCurrentUserFollowing) {
        const followingUser = await User.findByIdAndUpdate(isUserInDB.id, { $pull: { follower: req.userID } }, { new: true, useFindAndModify: false });
        const currentUser = await User.findByIdAndUpdate(req.userID, { $pull: { following: isUserInDB.id } }, { new: true, useFindAndModify: false });
        res.status(202).type("application/json").json({ profile: { ...profile(currentUser) } });
      } else {
        res.status(200).type("application/json").json({ profile: { ...profile(currentUser) } });
      }
    } else {
      throw new Error("User Not Found");
    }
  } catch (error) {
    next({ message: "Something Went Wrong Please try Again", error, status: 404 });
  }
})

/* GET /api/profiles/:username/following */

router.get("/:username/following", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
    const isUserInDB = await User.findOne({ username })
    if (isUserInDB) {
      const user = await User.findOne({ username }).populate("following");
      res.status(200).type("application/json").json(user.following.map((follow) => profile(follow)))
    } else {
      throw new Error("Page Not Found")
    }
  } catch (error) {
    next({ message: "Something Went Wrong Please try Again", error, status: 500 })
  }
});

/* GET /api/profiles/:username/follower */

router.get("/:username/follower", auth.verifyUserLoggedIn, async (req, res, next) => {
  const username = req.params.username;
  try {
		const isUserInDB = await User.findOne({ username });
		if (isUserInDB) {
			const user = await User.findOne({ username }).populate("follower");
			res.status(200)
				.type("application/json")
				.json(user.follower.map((follow) => profile(follow)));
		} else {
			throw new Error("Page Not Found");
		}
  } catch (error) {
		next({ message: "Something Went Wrong Please try Again", error, status: 500 });
  }
});

function profile (user) {
  return {
		username: user.username,
		bio: user.bio,
		image: user.image,
		following: `/api/profiles/${user.username}/following`,
		follower: `/api/profiles/${user.username}/follower`,
  };
}

module.exports = router;