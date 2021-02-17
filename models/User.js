const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
			lowercase: true,
			unique: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			minlength: 6,
			lowercase: true,
			unique: true,
			match: /^(?=.{4,25}$)(?:[a-zA-Z\d]+(?:(?:\.|-|_)[a-zA-Z\d])*)+$/,
		},
		bio: {
			type: String,
			minlength: 10,
			trim: true,
			default: null,
		},
		image: {
			type: String,
			default: null,
		},
		local: {
			password: {
				type: String,
				trim: true,
				minlength: 8,
				match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
			},
		},
		followings: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		followers: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		favorites: [
			{
				type: Schema.Types.ObjectId,
				ref: "Article",
			},
		],
	},
	{ timestamps: true }
);

async function hashPassword (next) {
  if (this.local.password.trim()) {
    try {
      this.local.password = await bcrypt.hash(this.local.password, 12);
      next();
    } catch (error) {
      next(error);
    }
	}
	next()
}

userSchema.pre("save", hashPassword)

userSchema.methods.validatePassword = async function (password) {
  const result = await bcrypt.compare(password, this.local.password);
  return result;
}

module.exports = mongoose.model("User", userSchema);