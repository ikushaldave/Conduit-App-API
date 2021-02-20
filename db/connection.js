const mongoose = require("mongoose");

exports.connect = function () {
  mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true },(error) => {
    console.log(error || "Connected to DB: true")
  })
}