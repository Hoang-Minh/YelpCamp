var express = require("express");
var router = express.Router();
var User = require("../models/user");
var middleware = require("../middleware/index");

// show user profile
router.get("/:id", middleware.isLoggedIn, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err || !foundUser){
            console.log(err);
            req.flash("error", "User not found");
            res.redirect("back");
        } else {            
            console.log(foundUser);
            res.render("users/show", {currentUser: foundUser});            
        }
    });
});

module.exports = router;