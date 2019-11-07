let express = require("express");
let router = express.Router({mergeParams: true});
let Camground = require("../models/campground");
let Review = require("../models/review");
//var middleware = require("../middleware/index");

router.get("/", async(req, res) => {
    try {
        let campground = Camground.findOne({slug: req.params.slug}).populate({
            path: "reviews",
            options: {
                sort: {
                    createdAt: -1 // sorting the populated reviews array to show the latest first
                }
            }
        });

        if(!campground){
            req.flash("error", "Campground is not found");
            return res.redirect("back");
        }
        
        res.render("reviews/index", {campground: campground});

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong....");
        return res.redirect("back");
    }


});