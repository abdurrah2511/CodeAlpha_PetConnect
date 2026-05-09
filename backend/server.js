const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");


// Load env variables
dotenv.config();

// Connect database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.static("../frontend"));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use("/api/auth", authRoutes);

app.use("/api/posts", postRoutes);

// Serve images
app.use("/uploads", express.static("uploads"));

app.use("/api/comments", commentRoutes);

app.use("/api/users", userRoutes);