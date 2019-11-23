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
        unique: true,
        required: "Contact email cannot be blank."
    }
});

module.exports = mongoose.model("Contact", contactSchema);