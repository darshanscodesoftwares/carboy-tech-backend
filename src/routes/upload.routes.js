const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==============================
// Multer storage (shared)
// ==============================
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// ==============================
// File filters
// ==============================
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
};

const audioFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) cb(null, true);
  else cb(new Error("Only audio files allowed"), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) cb(null, true);
  else cb(new Error("Only video files allowed"), false);
};

const documentFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only document files allowed"), false);
};

// ==============================
// Upload instances
// ==============================
const uploadImage = multer({ storage, fileFilter: imageFilter });
const uploadAudio = multer({ storage, fileFilter: audioFilter });
const uploadVideo = multer({ storage, fileFilter: videoFilter });
const uploadDocument = multer({ storage, fileFilter: documentFilter });

// ==============================
// Routes
// ==============================

/**
 * POST /api/technician/uploads/image
 * field name: image
 */
router.post("/image", uploadImage.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image uploaded" });
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

/**
 * POST /api/technician/uploads/audio
 * field name: audio
 */
router.post("/audio", uploadAudio.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No audio uploaded" });
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

/**
 * POST /api/technician/uploads/video
 * field name: video
 */
router.post("/video", uploadVideo.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No video uploaded" });
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

/**
 * POST /api/technician/uploads/document
 * field name: document
 */
router.post("/document", uploadDocument.single("document"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No document uploaded" });
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

module.exports = router;
