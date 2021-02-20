var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cloudinary = require("cloudinary").v2;

var db = require("./db/connection")
var auth = require("./middleware/auth")

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var profileRouter = require("./routes/profiles");
var articlesRouter = require("./routes/articles");
var tagsRouter = require("./routes/tags");

require("dotenv").config()
db.connect();
cloudinary.config({
	cloud_name: process.env.CLOUDNARY_CLOUD_NAME,
	api_key: process.env.CLOUDNARY_API_KEY,
	api_secret: process.env.CLOUDNARY_API_SECRET,
});

var app = express()

// Middleware

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth.currentLoggedUserInfo)

app.use('/', indexRouter);
app.use('/api/user', userRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/tags', tagsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err.message)
  res.status(err.status || 500);
  res.json({ "errors": { "message": err.message, "detail": err.detail, "errorCode": err.errorCode }});
});

module.exports = app;
