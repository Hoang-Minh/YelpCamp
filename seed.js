var mongoose    = require("mongoose"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment");


var data = [
    {
        name: "Silent Hill", 
        image: "https://images.unsplash.com/photo-1484886738597-d2e20a5320e5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2102&q=80", 
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Integer vitae justo eget magna fermentum iaculis eu non diam. Eget arcu dictum varius duis at consectetur lorem donec. In est ante in nibh mauris cursus mattis molestie. Pretium fusce id velit ut tortor. Elementum integer enim neque volutpat ac. Cursus in hac habitasse platea. Elit sed vulputate mi sit. Maecenas volutpat blandit aliquam etiam erat velit scelerisque. Vestibulum lorem sed risus ultricies tristique nulla. Egestas pretium aenean pharetra magna ac placerat. Massa massa ultricies mi quis. Scelerisque felis imperdiet proin fermentum leo. Vehicula ipsum a arcu cursus vitae congue. Quis ipsum suspendisse ultrices gravida dictum fusce ut placerat."
    },
    {
        name: "Grand Canyon", 
        image: "https://images.unsplash.com/photo-1487750404521-0bc4682c48c5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2100&q=80", 
        description: "Iaculis at erat pellentesque adipiscing commodo. Gravida neque convallis a cras semper auctor. Vitae auctor eu augue ut lectus arcu bibendum. Malesuada bibendum arcu vitae elementum. Varius vel pharetra vel turpis nunc. Adipiscing bibendum est ultricies integer quis auctor. Eu turpis egestas pretium aenean pharetra. Fringilla ut morbi tincidunt augue interdum velit euismod. Sed risus ultricies tristique nulla aliquet enim. Lacus vestibulum sed arcu non."
    },
    {
        name: "Irvine Trail", 
        image: "https://images.unsplash.com/photo-1466220549276-aef9ce186540?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2100&q=80", 
        description: "Sed nisi lacus sed viverra tellus in hac. In pellentesque massa placerat duis ultricies lacus sed. Id aliquet risus feugiat in ante metus dictum. Egestas diam in arcu cursus euismod quis viverra nibh cras. Pharetra et ultrices neque ornare aenean euismod elementum nisi. Pellentesque habitant morbi tristique senectus et netus et. Nisl nisi scelerisque eu ultrices vitae auctor. Eget est lorem ipsum dolor. At augue eget arcu dictum varius. Felis eget velit aliquet sagittis id. Nec ultrices dui sapien eget. Tellus id interdum velit laoreet id. Amet risus nullam eget felis eget."
    }
];

function seedDb(){
    // remove all campgrounds
    Campground.deleteMany({}, function(err){
        if(err){
            console.log(err);
        }else{
            console.log("campgrounds removed");

            // add a new campground
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Add campground");
                        //Create a comment
                        Comment.create({
                            text: "This place is great",
                            author: "Homer"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            }else{
                                console.log(comment);
                                campground.comments.push(comment);
                                campground.save(function(err){
                                    if(err){
                                        console.log(err);
                                    }else{
                                        console.log("'comment is added");
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
}

module.exports = seedDb;