const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const crypto = require("crypto");
const mailhelper = require("../public/js/mailhelper");
const randomstring = require("randomstring");
var Campground = require("../models/campground");

// root route
router.get("/", async (req, res) => {
  try{
    let randomCampgrounds = await Campground.find().limit(3);
    //console.log(randomCampgrounds.length);
    res.render("landing", {randomCampgrounds: randomCampgrounds});
    //res.render("campgrounds/index", {campgrounds: campgrounds});        
  } catch(error) {
    console.log(error);
    req.flash("error", "Something is wrong, cannot load landing page");
    res.redirect("/login");
  }
  
});

//show register form
router.get("/register", (req, res) => {
  res.render("register");
});

//hanlde signup logic
router.post("/register", async (req, res) => {
  let newUser = req.body.user;

  try {
    const foundUser = await User.findOne({email: newUser.email});

    if(foundUser){
      req.flash('error', 'Email is already in use.');
      return res.redirect('back');
    }

    if(newUser.email === process.env.GMAIL){
      newUser.isAdmin = true;
    }
    
    // Hash the password
    const hash = await User.hashPassword(newUser.password);

    // Generate secret token
    const secretToken = randomstring.generate();
    //console.log("Secret Token: " + secretToken);

    // Save secret token to the DB
    newUser.registerToken = secretToken;
    newUser.registerTokenExpires = Date.now() + 3600000; // 1hr    

    // need to hash password
    newUser.password = hash;       

    const content =
      "Thank you for becoming a Yelp Camp user.\n\n" +
      "Please click on the following link, or paste this into your browser to complete the registration process:\n\n" +
      "http://" +
      req.headers.host +
      "/register/" +
      secretToken +
      "\n\n" +
      "If you did not register, please ignore this email.\n"

    const mailOptions = {
      to: newUser.email,
      from: process.env.GMAIL,
      subject: "Yelp Camp Registration",
      text: content
    }

    await mailhelper.sendMail(mailOptions);

    // save to database    
    const user = await new User(newUser); 
    await user.save();
    req.flash(
      "success",
      "An e-mail has been sent to " + user.email + " with further instructions."
    );
    res.redirect("/login");


  } catch (error) {
    console.log(error);
    req.flash("error", "Something is wrong....");
    return res.redirect("back");
  }

});

router.get("/register/:token", async (req, res) => {  
  res.render("verify", {token: req.params.token} );  
});

router.post("/verify", async (req, res) => {  
  try {
    let user = await User.findOne(
      {
        registerToken: req.body.token,
        registerTokenExpires: {$gt: Date.now()}
      });

      if(!user){        
        req.flash("error", "Register token is invalid or has expired.");
        return res.redirect("/resend");
      }

      user.isVerified = true;
      user.registerToken = undefined;
      user.registerTokenExpires = undefined;      
      await user.save();
      
      req.flash("success", "Thank you for completing registration process");
      return res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Something is wrong....");
    return res.redirect("/login");
  }
});

router.get("/resend", async (req, res) => {
  res.render("resend");
})

router.post("/resend", async(req, res) => {
  try {
    const user = await User.findOne({email: req.body.email});

    if(!user){
      req.flash("error", "No account associated with the provied email");
      return res.redirect("back");
    }

    // Generate secret token
    const secretToken = randomstring.generate();
    console.log("Secret Token: " + secretToken);

    // Save secret token to the DB
    user.registerToken = secretToken;
    user.registerTokenExpires = Date.now() + 3600000; // 1hr    

    const content =
      "Thank you for becoming a Yelp Camp user.\n\n" +
      "Please click on the following link, or paste this into your browser to re-complete the registration process:\n\n" +
      "http://" +
      req.headers.host +
      "/register/" +
      secretToken +
      "\n\n" +
      "If you did not register, please ignore this email.\n"

    const mailOptions = {
      to: user.email,
      from: process.env.GMAIL,
      subject: "Yelp Camp Registration",
      text: content
    }

    await mailhelper.sendMail(mailOptions);

    // save to database    
    await user.save();
    req.flash(
      "success",
      "An e-mail has been sent to " + user.email + " with further instructions."
    );
    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Something is wrong");
    return res.redirect("back");
  }
});

//show login form
router.get("/login", (req, res) => {
  res.render("login");
});

//handle login  logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds/page/1",
    failureRedirect: "/login",
    failureFlash: true
  }),
  function(req, res) {
    
  }
);

//logout route
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success", "Logged you out");
  res.redirect("/");
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

    await mailhelper.sendMail(mailOptions);
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
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.isVerified = true; // set to true when user has successfully reset their password  
      await user.setPassword(req.body.password);
      await user.save();      
    } else {
      req.flash("error", "Passwords do not match.");
      return res.redirect("back");
    }
     
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
  
    await mailhelper.sendMail(mailOptions);
    req.flash("success", "Success! Your password has been changed.");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Something is wrong...");
    return res.redirect("back");
  }  
});

module.exports = router;
