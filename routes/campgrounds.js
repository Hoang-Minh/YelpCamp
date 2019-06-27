var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeoCoder = require("node-geocoder");
var multer = require("multer");
var cloudinary = require("cloudinary").v2;

var storage = multer.diskStorage({
    filename: function(req, file, callback){
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function(req, file, cb){
    //accept image files only
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

var options = {
    provider: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeoCoder(options);

// INDEX - show all campgrounds
router.get("/", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        // get from db
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds.length == 0){
                    req.flash("error", "No campgrounds match that query. Please try again");
                    res.redirect("back");
                } else{
                    res.render("campgrounds/index", {campgrounds: allCampgrounds});
                }
            }
        })
    } else {
        // get from db
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds});
            }
        })
    }
});

// CREATE - create new campground
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res){
    geocoder.geocode(req.body.campground.location, function(err, data){        
        if(err || !data.length){
            console.log(err);
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }        

        cloudinary.uploader.upload(req.file.path, {invalidate : true}, function(err, result){
            if(err){
                console.log(err);
                req.flash("error", "Upload error...");
                return res.redirect("back");
            }
            // add cloudinary url for the image to the campground object under image property            
            req.body.campground.image = {
                url: result.secure_url,
                publicId: result.public_id
            }
            // add author to campground
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            }

            req.body.campground.lat = data[0].latitude;            
            req.body.campground.lng = data[0].longitude;            
            req.body.campground.location = data[0].formattedAddress;

            Campground.create(req.body.campground, function(err, newlyCreated){
                if(err){
                    req.flash("error", "A new campground cannot be created");
                    console.log(err);
                } else {
                    console.log("Newly Created Campground: " + newlyCreated);
                    req.flash("success", "A new campground has been created");
                    res.redirect("/campgrounds");
                }
            });
        });        
    });
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/newCampground");
});

//SHOW - show more info about one campground
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//Edit Campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Cannot find campground");
            console.log("Edit Campground error: " + err);
        }        
        res.render("campgrounds/edit", {campground: foundCampground});
    });
        
});

//Update Campground route - data is not updated: url and publicId
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), async function(req, res){

    try {
        var data = await geocoder.geocode(req.body.campground.location);
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var foundCampground = await Campground.findById(req.params.id);
    
        console.log(foundCampground);
    
        var newData = {
            name: req.body.campground.name,
            description: req.body.campground.description,
            price: req.body.campground.price
        };
    
        if(location === foundCampground.location){
            newData.location = foundCampground.location;
            newData.lat = foundCampground.lat;
            newData.lng = foundCampground.lng;
        } else {
            newData.location = location;
            newData.lat = lat;
            newData.lng = lng;
        }
    
        deletePhotoOnCloud(foundCampground.image.publicId);
    
        var asset = await cloudinary.uploader.upload(req.file.path, {invalidate: true});
    
        newData.image = {
            url: asset.secure_url,
            publicId: asset.public_id
        };
    
        await Campground.updateOne({}, newData);
    
        req.flash("success", "Campground has been updated");
        res.redirect("/campgrounds/" + req.params.id);
        
    } catch (error) {
        console.log(error);
        req.flash("error", "Campground cannot update");
    }    
});

//Delete campground
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err || !campground){
            console.log("Delete route: " + err);
            req.flash("error", "Cannot find campground");            
            res.redirect("/campgrounds");
        } else {            
            deletePhotoOnCloud(campground.image.publicId);
            campground.remove();
            req.flash("success", "Campground has been deleted");
            res.redirect("/campgrounds");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function deletePhotoOnCloud(photoId) {

    cloudinary.uploader.destroy(photoId, {invalidate: true}, (err, result) => { 
        if(err){
            console.log(err);                        
        }
        console.log("Deleting photo id: " + photoId + " " + result.result);
    });
}

module.exports = router;