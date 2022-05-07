const express = require("express");
const port = 3000;
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const csrf = require('csurf');
const cookieParser = require('cookie-parser')
const fs = require('fs')
const app = express();
//Require Router
const FileRouter = require("./routers/FileRouter");
const AccountRouter = require("./routers/AccountRouter");

// ------------------------------------------------------------------------
//View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Static File
app.use(express.static(path.join(__dirname, "public")));

//Session Cookie
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

//Handle Form
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser())
app.use(csrf({ cookie: true }));


//Handle Router
app.use((req, res, next) => {
  req.vars = { root: __dirname };
  next();
});

app.use("/", AccountRouter);
app.use("/", FileRouter);


//Handle Error
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
  res.json({ code: 403, message: "Invalid csrf token" });
})
app.use((error, req, res, next) => {
  res.status(500).json({ code: 500, message: error });
})

//Run App
app.listen(port, () => {
  console.log("Run Success");
})

