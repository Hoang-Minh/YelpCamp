const mongoose = require("mongoose");

let contactSchema = new mongoose.Schema({
    message: {
        type: String,
        required: "Contact Message cannot be blank."
    },
    name: {
        type: String,
        required: "Contact name cannot be blank."
    },
    email: {
        type: String,        
        required: "Contact email cannot be blank."
    },
    subject: String,
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("Contact", contactSchema);