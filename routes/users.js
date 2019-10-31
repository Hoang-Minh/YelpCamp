var express = require("express");
var router = express.Router();
var User = require("../models/user");
var middleware = require("../middleware/index");

// show user profile
router.get("/:id", middleware.isLoggedIn, async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if(!user){
            req.flash("error", "User not found");
            return res.redirect("back");
        }

        res.render("users/show", {currentUserTest: user});

    } catch (error) {
        req.flash("error", "Something is wrong");
        return res.redirect("back");
    }    
});

module.exports = router;