var mongoose = require("mongoose");
var comment = require("./comment");

var campgroundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: "Campground name cannot be blank"
    },
    slug: {
        type: String,
        unique: true
    },
    price: String,
    image: {
        url: String,
        publicId: String
    },
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

campgroundSchema.pre('remove', async function() {
	await comment.deleteOne({
		_id: {
			$in: this.comments
		}
	});
});

campgroundSchema.pre('save', async function(){
    try{
        // check if a new campground is being saved, or if the campground name is being modified
        if(this.isNew || this.isModified('name'){
            this.slug = await generateUiqueSlug(this._id, this.name);
        })
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Campground", campgroundSchema);

async function generateUiqueSlug(id, campgroundName, slug){
    try{
        // generate the initial slug
        if(!slug){
            slug = slugify(campgroundName);
        }

        // check if a campground with the slug already exists
        let campground = await Campground.findOne({slug: slug});

        // check if a campground was found or if the found campground is the current campground
        if(!campground || campground._id.equals(id)){
            return slug;
        }

        // if not unique, generate a new slug
        let newSlug = slugify(campgroundName);

        // check again by calling the function recursively
        return await generateUiqueSlug(id, campgroundName, newSlug);
    } catch(err){
        throw new Error(err);
    }
}

function slugify(text){
    let slug = text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
                .replace(/[^\w\-]+/g, '')    // Replace all non-word chars
                .replace(/\-\-+/g, '-')      // Replace multiple - with single -
                .replace(/^-+/, '')          // Trim - from start of text
                .replace(/-+$/, '')          // Trim - from end of text
                .substring(0, 75);           // Trim at 75 characters
    return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}