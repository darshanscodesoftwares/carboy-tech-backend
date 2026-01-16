const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper: Get public base URL (HTTPS on Render, flexible for local dev)
const getPublicBaseUrl = (req) => {
  return (
    process.env.PUBLIC_BASE_URL ||
    `${req.protocol}://${req.get("host")}`
  );
};

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================================
// Multer storage (shared)
// ================================
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// ================================
// File filters
// ================================
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
  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF and Word documents allowed"), false);
};

// ================================
// Multer instances
// ================================
const uploadImage = multer({ storage, fileFilter: imageFilter });
const uploadAudio = multer({ storage, fileFilter: audioFilter });
const uploadVideo = multer({ storage, fileFilter: videoFilter });
const uploadDocument = multer({ storage, fileFilter: documentFilter });

// ================================
// Routes
// ================================

// Upload image
router.post('/image', uploadImage.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload audio
router.post('/audio', uploadAudio.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload video
router.post('/video', uploadVideo.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload document
router.post('/document', uploadDocument.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
