const Comment = require("../models/Comment");

// @route POST /api/comments/:postId
exports.addComment = async (req, res) => {
  try {
    const newComment = new Comment({
      post: req.params.postId,
      user: req.user._id,
      text: req.body.text,
    });

    const savedComment = await newComment.save();

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/comments/:postId
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};