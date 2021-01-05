const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const { use } = require("../routes/users");

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			match: /\S+@\S+\.\S+/,
			unique: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			minlength: 6,
			lowercase: true,
			match: /^(?=.{4,20}$)(?:[a-zA-Z\d]+(?:(?:\.|-|_)[a-zA-Z\d])*)+$/
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
				match: /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/,
			},
		},
		following: [{
			type: Schema.Types.ObjectId,
			ref: "User"
		}],
		follower: [{
			type: Schema.Types.ObjectId,
			ref: "User"
		}],
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