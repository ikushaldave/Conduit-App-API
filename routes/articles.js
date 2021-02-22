const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const slug = require("slug");
const multer = require("multer");
const { nanoid } = require("nanoid");

const User = require("../models/User");
const Article = require("../models/Article");
const Comment = require("../models/Comment");

const auth = require("../middleware/auth");
const s3Uploader = require("../middleware/s3uploader");

const customError = require("../modules/custom-error");

// multer

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/");
	},
	filename: function (req, file, cb) {
		cb(null, nanoid(16) + `.${file.mimetype.split("/")[1]}`);
	},
});

var upload = multer({ storage: storage });

/* GET /api/articles */

router.get("/", async (req, res, next) => {
	let _in = null;
	let _where = null;
	const limitArticle = req.query.limit || 20;
	const offset = req.query.offset || 0;
	let articles = [];

	try {
		if (req.query.tag) {
			_where = "tagList";
			_in = req.query.tag.split(",").map((tag) => tag.toLowerCase());
		}
		if (req.query.author) {
			const authors = await User.find({})
				.where("username")
				.in(req.query.author.split(",").map((author) => author.toLowerCase()))
				.select("_id");
			_where = "author";
			_in = authors.map((author) => author._id);
		}
		if (req.query.favorited) {
			const query = req.query.favorited.split(",").map((author) => author.toLowerCase());
			const articleIDFavByUser = await User.find({}).where("username").in(query).select("favorites");
			const favArticleIDs = articleIDFavByUser.map((user) => [...user.favorites]).flat();
			_where = "_id";
			_in = favArticleIDs;
		}

		if (_where && _in) {
			articles = await Article.find({})
				.where(_where)
				.in(_in)
				.sort({ createdAt: "desc" })
				.skip(+offset)
				.limit(+limitArticle)
				.populate("author");
		} else {
			articles = await Article.find({})
				.sort({ createdAt: "desc" })
				.skip(+offset)
				.limit(+limitArticle)
				.populate("author");
		}

		const allArticles = await Article.find({});

		res.status(200)
			.type("application/json")
			.json({ articles: articles.map((article) => articleGenerator(article, article.author, req.userID)), articlesCount: allArticles.length });
	} catch (error) {
		let detail = "author not found";
		let message = "bad request";
		let status = 404;
		if (error.message == "invalid-04") {
			detail = "article not found by following author, tags or favorited by authors";
		}
		next(customError(error.message, detail, message, status));
	}
});

/* GET /api/articles/feed */

router.get("/feed", auth.verifyUserLoggedIn, async (req, res, next) => {
	const limitArticle = req.query.limit || 20;
	const offset = req.query.offset || 0;
	try {
		const user = await User.findById(req.userID);
		const userFeed = await Article.find({})
			.where("author")
			.in([...user.followings, user._id])
			.sort({ createdAt: "desc" })
			.skip(+offset)
			.limit(+limitArticle)
			.populate("author");
		res.status(200)
			.type("application/json")
			.json({ articles: userFeed.map((feed) => articleGenerator(feed, feed.author, req.userID, req.userID)), articlesCount: userFeed.length });
	} catch (error) {
		let detail = "something went wrong please try again";
		let message = " Internal Server Error ";
		let errorCode = "server-01";
		next(customError(message, detail, message));
	}
});

/* GET /api/articles/:slug */

router.get("/:slug", async (req, res, next) => {
	const slugParam = req.params.slug;
	try {
		const article = await Article.findOne({ slug: slugParam }).populate("author");
		if (!article) throw new Error("invalid-04");
		res.status(200)
			.type("application/json")
			.json({ article: { ...articleGenerator(article, article.author, req.userID) } });
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
			const author = await User.findById(req.userID);
			res.status(201)
				.type("application/json")
				.json({ article: { ...articleGenerator(article, author, req.userID) } });
		} else {
			throw new Error("val-03");
		}
	} catch (error) {
		let errorCode = "val-04";
		let detail = "title is required, description is required ,body is required ";
		let message = error._message;
		let status = 422;
		if (error.message === "val-03") {
			message = "title should be unique";
			errorCode = error.message;
			detail = "title is already used by other user please use other title for better search result";
		}
		next(customError(errorCode, detail, message, status));
	}
});

/* PUT /api/articles/:slug */

router.put("/:slug", auth.verifyUserLoggedIn, async (req, res, next) => {
	const slugParam = req.params.slug;
	try {
		const article = await Article.findOne({ slug: slugParam }).populate("author");

		const { title, description, body, tagList } = req.body.article;

		if (!article) throw new Error("invalid-04");
		if (!(title && description && body)) throw new Error("val-04");

		const isUserOwnerOfArticle = article.author.id === req.userID;

		if (isUserOwnerOfArticle) {
			const modifiedArticle = await Article.findOneAndUpdate({ slug: slugParam }, { title, description, body, slug: slug(title) }, { new: true, useFindAndModify: false }).set("tagList", tagList);
			console.log(modifiedArticle);
			res.status(202)
				.type("application/json")
				.json({ article: { ...articleGenerator(modifiedArticle, article.author, req.userID) } });
		} else {
			throw new Error("auth-03");
		}
	} catch (error) {
		console.log(error);
		let detail = (message = status = null);

		if (error.message === "auth-03") {
			message = "you are not authorize to modify article";
			detail = "user is not authorize to edit a article it is not a owner of article";
			status = 403;
		} else if (error.message === "val-04") {
			detail = "title is required, description is required ,body is required ";
			message = error._message;
			status = 422;
		} else {
			detail = "Article not found";
			message = "bad request";
			status = 404;
		}

		next(customError(error.message, detail, message, status));
	}
});

/* DELETE /api/articles/:slug */

router.delete("/:slug", auth.verifyUserLoggedIn, async (req, res, next) => {
	const slugParam = req.params.slug;
	try {
		const article = await Article.findOne({ slug: slugParam }).populate("author");
		if (!article) throw new Error("invalid-06");
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
});

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
			},
		});
		if (article) {
			res.status(200)
				.type("application/json")
				.json({ comments: article.comments.map((comment) => commentGenerator(comment, comment.author, req.userID)) });
		} else {
			throw new Error("invalid-04");
		}
	} catch (error) {
		let detail = "Article not found";
		let message = "bad request";
		let status = 404;
		next(customError(error.message, detail, message, status));
	}
});

/* POST /api/articles/:slug/comments */

router.post("/:slug/comments", auth.verifyUserLoggedIn, async (req, res, next) => {
	const slugParam = req.params.slug;
	try {
		const article = await Article.findOne({ slug: slugParam });
		if (article) {
			const author = await User.findById(req.userID);
			const comment = await (await Comment.create({ body: req.body.comment.body, articleID: article.id, author: req.userID })).populate("author");
			const modifiedArticle = await Article.findOneAndUpdate({ slug: slugParam }, { $push: { comments: comment.id } }, { new: true, useFindAndModify: false });
			res.status(201)
				.type("application/json")
				.json({ comment: { ...commentGenerator(comment, author, req.userID) } });
		} else {
			throw new Error("invalid-06");
		}
	} catch (error) {
		let detail = "comment operation can't proceed because article not found";
		let message = "article not found";
		let status = 404;
		next(customError(error.message, detail, message, status));
	}
});

/* DELETE /api/articles/:slug/comments/:id */

router.delete("/:slug/comments/:id", auth.verifyUserLoggedIn, async (req, res, next) => {
	const slugParam = req.params.slug;
	const commentIdParam = req.params.id;
	try {
		const article = await Article.findOne({ slug: slugParam });
		const comment = await Comment.findById(commentIdParam).populate("author");
		if (!article) throw new Error("invalid-06");
		if (comment) {
			const isOwnerOfComment = comment.author.id === req.userID;
			if (!isOwnerOfComment) throw new Error("auth-05");
			const deletedComment = await Comment.findByIdAndDelete(commentIdParam);
			const modifiedArticle = await Article.findByIdAndUpdate(article.id, { $pull: { comments: commentIdParam } }, { new: true, useFindAndModify: false });
			res.status(201).type("application/json").json({ comment: "Comment Deleted Successfully" });
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
});

/* POST /api/articles/:slug/favorite */

router.post("/:slug/favorite", auth.verifyUserLoggedIn, async (req, res, next) => {
	const slugParam = req.params.slug;
	try {
		const article = await Article.findOne({ slug: slugParam });
		if (article) {
			const user = await User.findById(req.userID);
			const isFavoritesByUser = user.favorites.includes(article.id);
			if (isFavoritesByUser) {
				res.status(200)
					.type("application/json")
					.json({ article: articleGenerator(article, user, req.userID) });
			} else {
				const modifiedArticle = await Article.findByIdAndUpdate(article.id, { favoritesCount: article.favoritesCount + 1, $push: { favorites: req.userID } }, { new: true, useFindAndModify: false });
				const modifiedUser = await User.findByIdAndUpdate(req.userID, { $push: { favorites: article.id } }, { new: true, useFindAndModify: false });
				res.status(200)
					.type("application/json")
					.json({ article: articleGenerator(modifiedArticle, modifiedUser, req.userID) });
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
});

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
				res.status(200)
					.type("application/json")
					.json({ article: articleGenerator(modifiedArticle, modifiedUser, req.userID) });
			} else {
				res.status(200)
					.type("application/json")
					.json({ article: articleGenerator(article, user, req.userID) });
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
});

// Uploading Image

router.post("/uploadFile", upload.single("image"), async (req, res, next) => {
	const { filename } = req.file;
	try {
		const uploadPath = path.join(__dirname, "../uploads", filename);
		fs.readFile(uploadPath, async (err, data) => {
			if (err) throw new Error("upload-00");
			const arrayBuffer = await new Uint8Array(data);
			const result = await s3Uploader({ Body: arrayBuffer, Key: filename });
			fs.unlink(uploadPath, (err) => {
				if (err) throw new Error("unable to delete file");
				if (result) {
					return res
						.status(200)
						.type("application/json")
						.json({
							success: 1,
							file: {
								url: `https://conduit-app.s3.ap-south-1.amazonaws.com/${filename}`,
							},
						});
				} else {
					return res.status(422).type("application/json").json({
						success: 0,
					});
				}
			});
		});
	} catch (error) {
		next(error);
	}
});

function articleGenerator(article, author, loggedUserID = null) {
	const isLoggedUserIsFollowing = author.followings.includes(loggedUserID);
	const isLoggedUserIsFollower = author.followers.includes(loggedUserID);
	const isFavoritesByUser = author.favorites.includes(article.id);
	return {
		id: article.id,
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
			// followings: `/api/profiles/${author.username}/followings`,
			// followers: `/api/profiles/${author.username}/followers`,
		},
	};
}

module.exports = router;
