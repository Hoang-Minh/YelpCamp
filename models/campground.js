var mongoose = require("mongoose");
var comment = require("./comment");

var campgroundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: "Campground name cannot be blank."
    },
    image: {
        url: String,
        publicId: String
    },
    description: String,
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
    ],    
    price: String,
    
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now}
});

campgroundSchema.pre('remove', async function() {
	await comment.deleteOne({
		_id: {
			$in: this.comments
		}
	});
});

var Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;