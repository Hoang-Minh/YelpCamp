const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// root route
router.get("/", (req, res) => {
  res.render("landing");
});

//show register form
router.get("/register", (req, res) => {
  res.render("register");
});

//handle signup logic
router.post("/register", (req, res) => {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar,
    isAdmin: req.body.adminCode === process.env.ADMIN_CODE
  });

  User.register(newUser, req.body.password, (err, user) => {
    if (err || !user) {
      console.log(err);
      req.flash("error", err.message);
      return res.render("register");
    }
    // create an async array of function here ???

    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome to Yelp Camp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

//show login form
router.get("/login", (req, res) => {
  res.render("login");
});

//handle login  logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true
  }),
  function(req, res) {}
);

//logout route
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success", "Logged you out");
  res.redirect("/campgrounds");
});

router.get("/forgot", (req, res) => {
  res.render("forgot");
});

router.post("/forgot", async (req, res) => {
  try {
    let buff = await (async () => crypto.randomBytes(20))();
    let token = await (async () => buff.toString("hex"))();
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash("error", "No account associated with that email !!!");
      return res.redirect("/forgot");
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1hr
    user.save();

    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URL
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    let accessToken = await (async () => {
      let tokens = oauth2Client.refreshAccessToken();
      return tokens.credentials.access_token;
    });

    var auth = {
      type: "oauth2",
      user: process.env.GMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken
    };

    var transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: auth
    });

    var mailOptions = {
      to: user.email,
      from: process.env.GMAIL,
      subject: "YelpCamp Password Reset",
      text:
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
        "http://" +
        req.headers.host +
        "/reset/" +
        token +
        "\n\n" +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
    };

    await transporter.sendMail(mailOptions);
    req.flash(
      "success",
      "An e-mail has been sent to " + user.email + " with further instructions."
    );
    res.redirect("/login");    
  } catch (error) {
    console.log(error);
    res.redirect("/forgot");
  }
});

router.get("/reset/:token", async (req, res) => {
  let user = await User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }
  );

  if(!user){
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/forgot");
  }

  res.render("reset", { token: req.params.token });
  
});

router.post("/reset/:token", async (req, res) => {
  try {
    let user = await User.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
      }
    );
  
    if(!user){
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("back");
    }
  
    if (req.body.password === req.body.confirm){
      await user.setPassword(req.body.password);
      await user.save();      
    } else {
      req.flash("error", "Passwords do not match.");
      return res.redirect("back");
    }
  
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URL
    );
  
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
  
    let accessToken = await (async () => {
      let tokens = oauth2Client.refreshAccessToken();
      return tokens.credentials.access_token;
    });
    
    var auth = {
      type: "oauth2",
      user: process.env.GMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken 
    };

    var transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: auth
    });
  
    var mailOptions = {
      to: user.email,
      from: process.env.GMAIL,
      subject: "Your password has been changed",
      text:
        "Hello,\n\n" +
        "This is a confirmation that the password for your account " +
        user.email +
        " has just been changed.\n"
    };
  
    await transporter.sendMail(mailOptions);
    req.flash("success", "Success! Your password has been changed.");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Something is wrong...");
    return res.redirect("back");
  }  
});

module.exports = router;
