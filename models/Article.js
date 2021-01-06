const mongoose = require("mongoose");
const { Schema } = mongoose;

const articleSchema = new Schema(
	{
    slug: {
      type: String,
      required: true,
      unique: true
    },
		title: {
			type: String,
      required: true,
      minlength: 15,
      trim: true
		},
		description: {
			type: String,
      required: true,
      minlength: 25,
      trim: true
		},
		body: {
			type: String,
      required: true,
      minlength: 100,
      trim: true
		},
		tagList: [
			{
				type: String,
				lowercase: true
			},
		],
		favorited: {
			type: Boolean,
			default: false,
		},
		favoritesCount: {
			type: Number,
			default: 0,
		},
		comments: [{
			type: Schema.Types.ObjectId,
			ref: "Comment"
		}],
		author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);