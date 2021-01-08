const express = require("express");
const router = express.Router()
const slug = require("slug")
const auth = require("../middleware/auth");

const User = require("../models/User")
const Article = require("../models/Article")
const Comment = require("../models/Comment")

/* GET /api/articles */

router.get("/", async (req, res, next) => {

  let query = {}
  const limitArticle = req.query.limit ?? 20;
  const offset = req.query.offset ?? 0;

  try {
    if (req.query.tag) {
      if (req.query.tag.split(",").length > 1) {
        query["tagList"] = {
          $in: req.query.tag.split(",").map((tag) =>  tag.toLowerCase())};
      } else { 
        query["tagList"] = req.query.tag;
      }
    }
    if (req.query.author) {
      const author = await User.findOne({ username: req.query.author })
      if (author) {
        query["author"] = author.id;
      } else {
        throw new Error("invalid-03");
      }
    }
    if (req.query.favorited) {
      const author = await User.findOne({ username: req.query.favorited });
      if (author) {
      query["favorites"] = author.id;
      } else {
        throw new Error("invalid-03");
      }
    }

    const articles = await Article.find(query).sort({ "createdAt": "desc" }).skip(+offset).limit(+limitArticle).populate("author");

    if (articles.length > 0) {
      res.status(200).type("application/json").json({ articles: articles.map((article) => articleGenerator(article, article.author, req.userID))})
    } else {
      throw new Error("invalid-04");
    }
  } catch (error) {
    let detail = "author not found";
    let message = "bad request";
    let status = 404;
    if (error.message == "invalid-04") {
      detail = "article not found by following author, tags or favorited by authors";
    }
    next(customError(error.message, detail, message, status));
  }
})

/* GET /api/articles/feed */

router.get("/feed", auth.verifyUserLoggedIn, async (req, res, next) => {
  const limitArticle = req.query.limit ?? 20;
  const offset = req.query.offset ?? 0;
  try {
    const userFeed = await Article.find({ author: req.userID }).sort({ "createdAt" : "desc" }).skip(+offset).limit(+limitArticle).populate("author");
    res.status(200).type("application/json").json({ articles: userFeed.map((feed) => articleGenerator(feed, feed.author, req.userID, req.userID))})
  } catch (error) {
    next({ message: "Something Went Wrong", error, status: 500})
  }
})

/* GET /api/articles/:slug */

router.get("/:slug", async (req, res, next) => {
	const slugParam = req.params.slug;
  try {
    const article = await Article.findOne({ slug: slugParam }).populate("author");
    if (!article) throw new Error("invalid-04")
    res.status(200).type("application/json").json({ article: { ...articleGenerator(article, article.author, req.userID) }})
  } catch (error) {
    let detail = "Article not found";
    let message = "bad request";
    let status = 404;
    next(customError(error.message, detail, message, status));
  }
});

/* POST /api/articles */

router.post("/", auth.verifyUserLoggedIn, async (req, res, next) => {
  try {
    const isSlugAvailable = await Article.findOne({ slug: slug(req.body.article.title) });
    if (!isSlugAvailable) {
      const article = await Article.create({
        ...req.body.article,
        slug: slug(req.body.article.title),
        author: req.userID,
      });
      const author = await User.findById(req.userID)
      res.status(201).type("application/json").json({ article: { ...articleGenerator(article, author, req.userID) } });
    } else {
      throw new Error("val-03")
    }
  } catch (error) {
    let errorCode = "val-04";
    let detail = "title is required, description is required ,body is required ";
    let message = error._message;
    let status = 422;
    if (error.message === "val-03") {
      message = "title should be unique"
      errorCode = error.message;
      detail = "title is already used by other user please use other title for better search result";
    }
    next(customError(errorCode, detail, message, status));
  }
})

/* PUT /api/articles/:slug */

router.put("/:slug", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
    const isSlugAvailable = await Article.findOne({ slug: slug(req.body.article.title) });
    if(isSlugAvailable) throw new Error("val-04")
    const article = await Article.findOne({ slug: slugParam }).populate("author");
    const isUserOwnerOfArticle = article.author.id === req.userID;
    if (isUserOwnerOfArticle) {
      if (req.body.article.title) {
        req.body.article.slug = slug(req.body.article.title)
      }
      if (req.body.article.tagList) {
        article.tagList.addToSet(req.body.article.tagList.join(","));
      }
      const modifiedArticle = await Article.findOneAndUpdate({ slug: slugParam }, { ...req.body.article }, { new: true, useFindAndModify: false });
      res.status(202).type("application/json").json({ article: { ...articleGenerator(modifiedArticle, article.author, req.userID) }})
    } else {
      throw new Error("auth-03")
    }
  } catch (error) {
    let detail = "title is required, description is required ,body is required ";
    let message = error._message;
    let status = 422;
    if (error.message === "auth-03") {
      message = "you are not authorize to modify article";
      detail = "user is not authorize to edit a article it is not a owner of article";
      status = 403
    }
    next(customError(error.message, detail, message, status));
  }
})

/* DELETE /api/articles/:slug */

router.delete("/:slug", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
    const article = await Article.findOne({ slug: slugParam }).populate("author");
    if(!article) throw new Error("invalid-06")
    const isUserOwnerOfArticle = article.author.id === req.userID;
    if (isUserOwnerOfArticle) {
      const modifiedArticle = await Article.findOneAndDelete({ slug: slugParam });
      res.status(202).type("application/json").json({ article: "Article Had Been Deleted" });
    } else {
      throw new Error("auth-04");
    }
  } catch (error) {
    let detail = "operation can't complete because article not found";
    let message = "article not found";
    let status = 404;
    if (error.message === "auth-04") {
      message = "you are not authorize to delete article";
      detail = "user is not authorize to delete a article it is not a owner of article";
      status = 403;
    }
    next(customError(error.message, detail, message, status));
  }
})

/* GET /api/articles/:slug/comments */

router.get("/:slug/comments", async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
    const article = await Article.findOne({ slug: slugParam }).populate({
        path: "comments",
        model: "Comment",
        populate: {
          path: "author",
          model: "User",
        }
    })
    if (article) {
      res.status(200).type("application/json").json({ "comments": article.comments.map((comment) => commentGenerator(comment, comment.author, req.userID))})
		} else {
			throw new Error("invalid-04");
		}
  } catch (error) {
		let detail = "Article not found";
		let message = "bad request";
		let status = 404;
		next(customError(error.message, detail, message, status));
  }
})

/* POST /api/articles/:slug/comments */

router.post("/:slug/comments", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
    const article = await Article.findOne({ slug: slugParam });
    if (article) {
      const author = await User.findById(req.userID);
      const comment = await (await Comment.create({ body: req.body.comment.body, articleID: article.id, author: req.userID })).populate("author");
      const modifiedArticle = await Article.findOneAndUpdate({ slug: slugParam }, { $push: { comments: comment.id } }, { new: true, useFindAndModify: false });
      res.status(201).type("application/json").json({ "comment": { ...commentGenerator(comment, author, req.userID) }})
    } else {
      throw new Error("invalid-06")
    }
  } catch (error) {
    let detail = "comment operation can't proceed because article not found";
    let message = "article not found";
    let status = 404;
    next(customError(error.message, detail, message, status));
  }
})

/* DELETE /api/articles/:slug/comments/:id */

router.delete("/:slug/comments/:id", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  const commentIdParam = req.params.id;
  try {
    const article = await Article.findOne({ slug: slugParam });
    const comment = await Comment.findById(commentIdParam).populate("author");
    if(!article) throw new Error("invalid-06")
    if (comment) {
      const isOwnerOfComment = comment.author.id === req.userID;
      if(!isOwnerOfComment) throw new Error("auth-05")
      const deletedComment = await Comment.findByIdAndDelete(commentIdParam);
      const modifiedArticle = await Article.findByIdAndUpdate(article.id,{$pull :{ "comments": commentIdParam }}, { new: true, useFindAndModify: false })
			res.status(201)
				.type("application/json")
				.json({ comment: "Comment Deleted Successfully" });
    } else {
			throw new Error("invalid-07");
		}
  } catch (error) {
    let detail = "operation can't complete because article not found";
    let message = "article not found";
    let status = 404;
    if (error.message === "auth-05") {
      message = "you are not authorize to delete comment";
      detail = "user is not authorize to delete a comment it is not a owner of comment";
      status = 403;
    }
    if (error.message === "invalid-07") {
      message = "operation can't complete because comment not found";
      detail = "comment not found";
    }
    next(customError(error.message, detail, message, status));
  }
})

/* POST /api/articles/:slug/favorite */

router.post("/:slug/favorite", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
    const article = await Article.findOne({ slug: slugParam });
    if (article) {
      const user = await User.findById(req.userID);
      const isFavoritesByUser = user.favorites.includes(article.id)
      if (isFavoritesByUser) {
        res.status(200).type("application/json").json({ article: articleGenerator(article, user, req.userID) })
      } else {
        const modifiedArticle = await Article.findByIdAndUpdate(article.id, { favoritesCount: article.favoritesCount + 1, $push: { favorites: req.userID } }, { new: true, useFindAndModify: false });
        const modifiedUser = await User.findByIdAndUpdate(req.userID, { $push: { favorites: article.id } }, { new: true, useFindAndModify: false });
        res.status(200).type("application/json").json({ article: articleGenerator(modifiedArticle, modifiedUser, req.userID) })
      }
    } else {
      throw new Error("invalid-06");
    }
  } catch (error) {
    let detail = "operation can't complete because article not found";
		let message = "article not found";
    let status = 404;
    next(customError(error.message, detail, message, status));
  }
})

/* DELETE /api/articles/:slug/favorite */

router.delete("/:slug/favorite", auth.verifyUserLoggedIn, async (req, res, next) => {
  const slugParam = req.params.slug;
  try {
		const article = await Article.findOne({ slug: slugParam });
		if (article) {
			const user = await User.findById(req.userID);
			const isFavoritesByUser = user.favorites.includes(article.id);
			if (isFavoritesByUser) {
        const modifiedArticle = await Article.findByIdAndUpdate(article.id, { favoritesCount: article.favoritesCount - 1, $pull: { favorites: req.userID } }, { new: true, useFindAndModify: false });
        const modifiedUser = await User.findByIdAndUpdate(req.userID, { $pull: { favorites: article.id } }, { new: true, useFindAndModify: false });
        res.status(200).type("application/json").json({ article: articleGenerator(modifiedArticle, modifiedUser, req.userID) });
        } else {
				res.status(200).type("application/json").json({ article: articleGenerator(article, user, req.userID) });
			}
		} else {
			throw new Error("invalid-06");
		}
  } catch (error) {
    let detail = "operation can't complete because article not found";
    let message = "article not found";
    let status = 404;
		next(customError(error.message, detail, message, status));
  }
})

function articleGenerator (article, author, loggedUserID = null) {
	const isLoggedUserIsFollowing = author.followings.includes(loggedUserID);
  const isLoggedUserIsFollower = author.followers.includes(loggedUserID);
  const isFavoritesByUser = author.favorites.includes(article.id);
	return {
		slug: article.slug,
		title: article.title,
		description: article.description,
		body: article.body,
		tagList: article.tagList,
		createdAt: article.createdAt,
		updatedAt: article.updatedAt,
		favorited: isFavoritesByUser,
		favoritesCount: article.favoritesCount,
		author: {
			username: author.username,
			bio: author.bio,
			image: author.image,
			following: isLoggedUserIsFollowing,
			follower: isLoggedUserIsFollower,
			followings: `/api/profiles/${author.username}/followings`,
			followers: `/api/profiles/${author.username}/followers`,
		},
	};
}

function commentGenerator(comment, author, loggedUserID = null) {
	const isLoggedUserIsFollowing = author.followings.includes(loggedUserID);
  const isLoggedUserIsFollower = author.followers.includes(loggedUserID);
	return {
		id: comment.id,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
		body: comment.body,
		author: {
			username: author.username,
			bio: author.bio,
			image: author.image,
			following: isLoggedUserIsFollowing,
			follower: isLoggedUserIsFollower,
			followings: `/api/profiles/${author.username}/followings`,
			followers: `/api/profiles/${author.username}/followers`,
		},
	};
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