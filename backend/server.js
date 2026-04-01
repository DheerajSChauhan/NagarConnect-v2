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

const idProofUploadsDir = path.join(__dirname, "uploads", "id-proofs");
if (!fs.existsSync(idProofUploadsDir)) {
  fs.mkdirSync(idProofUploadsDir, { recursive: true });
}

// Import route files
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const discussionRoutes = require("./routes/discussionRoutes");

// Initialize express app
const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
    origin: (origin, callback) => {
      const isNagarConnectVercelOrigin =
        typeof origin === "string" &&
        /^https:\/\/nagar-connect-v2(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

      if (!origin) return callback(null, true);
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        isNagarConnectVercelOrigin
      ) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Root endpoint for quick deployment verification
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NagarConnect backend is running",
    health: "/api/health",
  });
});

// Health check endpoint for hosting platform probes
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

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
