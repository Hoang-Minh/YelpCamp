const express = require("express");
const router = express.Router();
const Contact = require("../models/contact");

router.get("/", (req, res) => {
    res.render("contact");
});

router.post("/", async (req, res) => {
    try {
        let contact = {
            name: req.body.contact.name,
            email: req.body.contact.email,
            message: req.body.contact.message
        };
        console.log(contact);

        let newMessage = await Contact.create(contact);
        console.log(newMessage);
        req.flash("success", "Your feedback has been submitted.")
        res.redirect("/contact");
    } catch (error) {
        console.log(error);
        req.flash("error", "Cannot submit comment. Please try again later");
        res.redirect("back");
    }

});

module.exports = router;