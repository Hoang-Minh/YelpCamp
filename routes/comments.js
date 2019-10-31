var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");

// Comments New - done async
router.get("/new", middleware.isLoggedIn, async (req, res) => {
    try {
        // let campground = await Campground.findById(req.params.id);
        let campground = await Campground.findOne({slug: req.params.slug});

        if(!campground){
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }

        res.render("comments/new", {campground: campground});

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong");
        return res.redirect("back");
    }    
});

//Comments Create - done async
router.post("/", middleware.isLoggedIn, async (req, res) => {
    try {
        // let campground = await Campground.findById(req.params.id);
        let campground = await Campground.findOne({slug: req.params.slug});

        if(!campground){
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }

        req.body.comment.author = {
            id: req.user._id,
            username: req.user.username                
        }
        
        let comment = await Comment.create(req.body.comment);
        campground.comments.push(comment);

        //campground.save();
        await Campground.create(campground);
        //console.log(comment);
        req.flash("success", "Comment is created");
        // res.redirect("/campgrounds/" + campground._id);
        res.redirect("/campgrounds/" + campground.slug);

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong");
        return res.redirect("back");
    }   
});

// Comment edit route - done async
router.get("/:comment_id/edit", middleware.checkCommentOwnership, async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.comment_id);
        if(!comment){
            req.flash("error", "Comment not found");
            return res.redirect("back");
        }

        // res.render("comments/edit", {campground_id: req.params.id, comment: comment});
        res.render("comments/edit", {campground_slug: req.params.slug, comment: comment});

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong....");
        return res.redirect("back");
    }
});

// Comment update route - done async
router.put("/:comment_id", middleware.checkCommentOwnership, async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.comment_id);

        if(!comment){
            req.flash("error", "Comment not found...");
            return res.redirect("back");
        }
        comment.text = req.body.comment.text;

        await Comment.updateOne({}, comment);

        req.flash("success", "Comment has been updated");
        // res.redirect("/campgrounds/" + req.params.id);
        res.redirect("/campgrounds/" + req.params.slug);
    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong....");
        return res.redirect("back");
    }
});

// Comment Destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, async (req, res) => {
    
    try {
        let comment = await Comment.findById(req.params.comment_id);

        if(!comment){
            req.flash("error", "Comment not found");
            return res.redirect("back");
        }
        comment.remove();

        // let campground = await Campground.findById(req.params.id);
        let campground = await Campground.findOne({slug: req.params.slug});

        if(!campground){
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }

        await Campground.updateOne(
            {},
            {$pull: {comments: req.params.comment_id}},
            {new: true},
        );                     

        req.flash("success", "Comment has been deleted");
        // res.redirect("/campgrounds/" + req.params.id);
        res.redirect("/campgrounds/" + req.params.slug);

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong...");
        return res.redirect("back");
    }
});

module.exports = router;