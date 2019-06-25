var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");

// Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            console.log("Comment new rount " + err);
        }else{
            console.log("Found campground: " + foundCampground);
            res.render("comments/new", {campground: foundCampground});
        }
    });    
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err || !campground){
            req.flash("error", "Campground not found");
            console.log(err);
            res.redirect("/campgrounds");
        } else {            
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Comment cannot be created");
                    console.log(err);
                }else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    //save comment
                    campground.comments.push(comment);
                    campground.save();
                    console.log(comment);
                    req.flash("success", "Comment is created");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
    
});

// Comment edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err || !foundComment){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
    });
    
});

// Comment update route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            req.flash("success", "Comment has been updated");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });    
});

// Comment Destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    
    Comment.findByIdAndDelete(req.params.comment_id, function(err){
        if(err){
            req.flash("error", "Cannot delete comment");
            res.redirect("back");
        } else {
            req.flash("success", "Comment has been deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
    
});

module.exports = router;