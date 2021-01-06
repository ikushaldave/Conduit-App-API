const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  body: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  articleID: {
    type: Schema.Types.ObjectId,
    ref: "Article",
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User"
  }
}, {timestamps: true})

module.exports = mongoose.model("Comment", commentSchema)