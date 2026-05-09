const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
    username: [{
        type: String,
        required: true,
        unique: true,
      }],
    profilePic: [{
        type: String,
        default: "/defaults/avatar1.png",
      }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);