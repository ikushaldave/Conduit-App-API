var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");

var db = require("./db/connection")
var auth = require("./middleware/auth")

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var profileRouter = require("./routes/profiles");
var articlesRouter = require("./routes/articles");
var tagsRouter = require("./routes/tags");

require("dotenv").config()
db.connect();

var app = express()

// Middleware

app.use(logger('dev'));
app.use(cors());
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
