const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { toggleLike } = require("../controllers/postController");


const {
  createPost,
  getPosts,
} = require("../controllers/postController");

// Create post (protected + image upload)
router.post("/", protect, upload.single("image"), createPost);

// Get all posts
router.get("/", protect, getPosts);

router.put("/:id/like", protect, toggleLike);

module.exports = router;