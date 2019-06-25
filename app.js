require("dotenv").config();
var express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user"),
  seedDb = require("./seed.js"),
  commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index"),
  userRoutes = require("./routes/users"),
  methodOverride = require("method-override"),
  flash = require("connect-flash");

//seedDb();
mongoose.connect("mongodb://localhost/yelp_camp", {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
});
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(flash());
app.locals.moment = require("moment");

//Passport configuration
app.use(
  require("express-session")({
    secret: "I am Minh",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/users", userRoutes);

var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Server is listening at port " + port);
});
