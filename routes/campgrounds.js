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

// INDEX - show all campgrounds - done async
router.get("/", async function(req, res){
    try {
        
        if(req.query.search){
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            
            // get from db
            var campgrounds = await Campground.find({name: regex});
    
            if(campgrounds.length == 0){
                req.flash("error", "No campgrounds match that query. Please try again");
                return res.redirect("back");
            }
    
            res.render("campgrounds/index", {campgrounds: campgrounds});
            
        } else {
            // get from db
            var campgrounds = await Campground.find({});
            res.render("campgrounds/index", {campgrounds: campgrounds});        
        }
    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong. Please try again");
        return res.redirect("back");
    }
});

// CREATE - create new campground - done async
router.post("/", middleware.isLoggedIn, upload.single("image"), async (req, res) => {

    try {
        let data = await geocoder.geocode(req.body.campground.location);       

        let campground = {
            name: req.body.campground.name,
            price: req.body.campground.price,            
            description: req.body.campground.description,
            location: data[0].formattedAddress,
            lat: data[0].latitude,
            lng: data[0].longitude,
            author: {
                id: req.user._id,
                username: req.user.username
            }
        }

        console.log(campground);

        let uploadOptions = {
            invalidate: true,
            folder: process.env.CLOUDINARY_FOLDER                
        };

        let result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        
        campground.image = {
            url: result.secure_url,
            publicId: result.public_id
        }       

        console.log(campground);

        let newlyCreatedCampground = await Campground.create(campground);        
        console.log("Newly Created Campground: " + newlyCreatedCampground);
        req.flash("success", "A new campground has been created");
        res.redirect("/campgrounds");

    } catch (error) {
        console.log(error);
        req.flash("error", "Cannot create new campground");
        return res.redirect("back");
    }    
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/newCampground");
});

//SHOW - show more info about one campground - done async
router.get("/:slug", async function(req, res){
    try {
        // let foundCampground = await Campground.findById(req.params.id).populate("comments");
        let foundCampground = await Campground.findOne({slug: req.params.slug}).populate("comments likes");
        res.render("campgrounds/show", {campground: foundCampground});
    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong");
    }        
});

//Edit Campground route - done async
router.get("/:slug/edit", middleware.checkCampgroundOwnership, async (req, res) => {
    try {
        // let foundCampground = await Campground.findById(req.params.id);
        let foundCampground = await Campground.findOne({slug: req.params.slug});
        if(!foundCampground){
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }

        res.render("campgrounds/edit", {campground: foundCampground});

    } catch (error) {
        console.log(error);
        req.flash("error", "Campground cannot be displayed");
    }   
        
});


//Update Campground route - data is not updated: url and publicId
router.put("/:slug", middleware.checkCampgroundOwnership, upload.single("image"), async (req, res) => {

    try {
        var data = await geocoder.geocode(req.body.campground.location);
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        // var foundCampground = await Campground.findById(req.params.id);
        var foundCampground = await Campground.findOne({slug: req.params.slug});

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
        res.redirect("/campgrounds/" + req.params.slug);
        
    } catch (error) {
        console.log(error);
        req.flash("error", "Campground cannot update");
    }    
});

//Delete campground
router.delete("/:slug", middleware.checkCampgroundOwnership, async (req, res) => {
    try {
        // let campground = await Campground.findById(req.params.id);
        let campground = await Campground.findOne({slug: req.params.slug});
        if(!campground){
            req.flash("error", "Cannot find campground");            
            return res.redirect("back");
        }

        deletePhotoOnCloud(campground.image.publicId);
        campground.remove();
        req.flash("success", "Campground has been deleted");
        res.redirect("/campgrounds");        
    } catch (error) {
        console.log("Delete route: " + error);
        req.flash("error", "Cannot find campground");            
        res.redirect("/campgrounds");
    }    
});

router.post("/:slug/like", middleware.isLoggedIn, async(req, res) => {
    try {
        let campground = await Campground.findOne({slug: req.params.slug});

        if(!campground){
            req.flash("error", "Cannot find campground");
            return  res.redirect("back");
        }

        // check if req.user._id exists in foundCampground.likes
        let foundUserLike = campground.likes.some(like => like.equals(req.user._id));

        if(foundUserLike){
            // user already liked, removing like
            campground.likes.pull(req.user._id);
        } else {
            // adding new user like
            campground.likes.push(req.user);
        }   

        await campground.save();
        return res.redirect("/campgrounds/" + campground.slug);

    } catch (error) {
        console.log(error);
        req.flash("error", "Something is wrong....");
        return  res.redirect("back");
    }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

async function deletePhotoOnCloud(photoId) {
    try {
        var result = await cloudinary.uploader.destroy(photoId, {invalidate: true});
        console.log("Deleting photo id: " + photoId + " " + result.result);
    } catch (error) {
        console.log("Delete photo error: " + error);
    }    
}

module.exports = router;