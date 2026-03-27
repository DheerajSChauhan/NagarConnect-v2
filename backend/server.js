const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer"); // For file upload errors

// Load env vars
dotenv.config({ path: "./.env" });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "complaints");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import route files
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const discussionRoutes = require("./routes/discussionRoutes");

// Initialize express app
const app = express();

// Middleware: JSON and URL-encoded body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware: Cookie parser
app.use(cookieParser());

// Middleware: Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware: Dev logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware: Enable CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Mount route files
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/discussions", discussionRoutes);

// Global error handling (including multer errors)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      });
    }
  }

  console.error(error.stack);
  res.status(500).json({
    success: false,
    error: error.message || "Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1));
});
