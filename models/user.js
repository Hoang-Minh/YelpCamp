const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  avatar: String,
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  registerToken: String,
  registerTokenExpires: Date,
  isVerified: { type: Boolean, default: false },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
module.exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Hasing failed: " + error);
  }
};

module.exports.comparePassword = async (inputPassword, hasedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hasedPassword);
  } catch (error) {
    throw new Error("Comparing failed", error);
  }
};
