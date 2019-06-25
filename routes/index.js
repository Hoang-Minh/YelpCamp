var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// root route
router.get("/", function(req, res) {
  res.render("landing");
});

//show register form
router.get("/register", function(req, res) {
  res.render("register");
});

//handle signup logic
router.post("/register", function(req, res) {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar,
    isAdmin: req.body.adminCode === process.env.ADMIN_CODE
  });

  User.register(newUser, req.body.password, function(err, user) {
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
router.get("/login", function(req, res) {
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
router.get("/logout", function(req, res) {
  req.logOut();
  req.flash("success", "Logged you out");
  res.redirect("/campgrounds");
});

router.get("/forgot", function(req, res) {
  res.render("forgot");
});

router.post("/forgot", function(req, res) {
  async.waterfall(
    [
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },

      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash("error", "No account associated with that email !!!");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1hr

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },

      function(token, user, done) {        

        const oauth2Client = new OAuth2(
          process.env.CLIENT_ID,
          process.env.CLIENT_SECRET,
          "https://developers.google.com/oauthplayground" // Redirect URL
        );
        
        oauth2Client.setCredentials({
          refresh_token: process.env.REFRESH_TOKEN
        });

        var auth = {
          type: "oauth2",
          user: process.env.GMAIL,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: async function(){
            const tokens = await oauth2Client.refreshAccessToken();
            return tokens.credentials.access_token;
          }
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

        transporter.sendMail(mailOptions, function(err) {
          if (err) {
            console.log(err);
            req.flash(
              "error",
              "Error. An email cannot be sent to " + user.email
            );
            res.redirect("back");
          }
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      }
    ],
    function(err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset/:token", function(req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    function(err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", function(req, res) {
  async.waterfall(
    [
      function(done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          function(err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }

            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function(err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },

      function(user, done) {
        const oauth2Client = new OAuth2(
          process.env.CLIENT_ID,
          process.env.CLIENT_SECRET,
          "https://developers.google.com/oauthplayground" // Redirect URL
        );
        
        oauth2Client.setCredentials({
          refresh_token: process.env.REFRESH_TOKEN
        });

        var auth = {
          type: "oauth2",
          user: process.env.GMAIL,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: async function(){
            const tokens = await oauth2Client.refreshAccessToken();
            return tokens.credentials.access_token;
          }
        };

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

        transporter.sendMail(mailOptions, function(err) {
          if (err) {
            console.log(err);
            req.flash(
              "error",
              "Error. An email cannot be sent to " + user.email
            );
            res.redirect("back");
          }
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      }
    ],
    function(err) {
      if (err) {
        console.log(err);
        req.flash("error", "Unknown error");
        res.redirect("back");
      }
      res.redirect("/campgrounds");
    }
  );
});

module.exports = router;
