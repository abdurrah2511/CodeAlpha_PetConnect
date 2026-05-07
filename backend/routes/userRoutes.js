const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const { toggleFollow, getUser, getAllUsers } = require("../controllers/userController");

router.put("/:id/follow", protect, toggleFollow);


router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUser);


module.exports = router;