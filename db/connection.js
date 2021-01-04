const mongoose = require("mongoose");

exports.connect = function () {
  mongoose.connect("mongodb://localhost:27017/conduit", { useNewUrlParser: true, useUnifiedTopology: true },(error) => {
    console.log(error ?? "Connected to DB: true")
  })
}