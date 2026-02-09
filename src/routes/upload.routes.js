const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { compressImage } = require("../utils/imageCompressor");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
 fs.mkdirSync(uploadDir, { recursive: true });
}
const tmpUploadDir = path.join(__dirname, "../../uploads/tmp");
if (!fs.existsSync(tmpUploadDir)) {
 fs.mkdirSync(tmpUploadDir, { recursive: true });
}

// ==============================
// Multer storage (shared)
// ==============================
const storage = multer.diskStorage({
 destination: tmpUploadDir,
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
 const mime = file.mimetype;
 const ext = path.extname(file.originalname).toLowerCase();

 const allowedMimeTypes = [
   "application/pdf",

   "application/msword",
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

   "application/vnd.ms-excel",
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

   "text/csv",
   "text/plain",

   "application/zip",
   "application/x-zip-compressed",
   "application/x-rar-compressed",

   "image/jpeg",
   "image/png",
   "image/webp",

   // HTML
   "text/html",
   "application/xhtml+xml",

   // Mobile chrome
   "multipart/related",
   "message/rfc822",
   "application/x-mimearchive",

   // fallback
   "application/octet-stream",
 ];

 const allowedExts = [
   ".pdf",
   ".doc",
   ".docx",
   ".xls",
   ".xlsx",
   ".csv",
   ".txt",
   ".zip",
   ".rar",
   ".html",
   ".htm",
   ".mht",
   ".mhtml",
   ".jpg",
   ".jpeg",
   ".png",
   ".webp",
 ];

 if (allowedMimeTypes.includes(mime) || allowedExts.includes(ext)) {
   cb(null, true);
 } else {
   cb(new Error(`Unsupported file type: ${mime}`), false);
 }
};



// ==============================
// Upload instances
// ==============================
const uploadImage = multer({
 storage,
 fileFilter: imageFilter,
 limits: { fileSize: 10 * 1024 * 1024 },
});
const uploadAudio = multer({ storage, fileFilter: audioFilter });
const uploadVideo = multer({ storage, fileFilter: videoFilter });
const uploadDocument = multer({ storage, fileFilter: documentFilter });

/* ==============================
  🆕 OBD UPLOAD (NEW)
================================ */
const uploadOBD = multer({
 storage,
 fileFilter: (req, file, cb) => {
   // allow images + documents
   if (
     file.mimetype.startsWith("image/") ||
     file.mimetype === "application/pdf" ||
     file.mimetype === "text/html"
   ) {
     cb(null, true);
   } else {
     cb(new Error("Invalid OBD file type"), false);
   }
 },
});

// ==============================
// Routes
// ==============================

/**
* POST /api/technician/uploads/image
* field name: image
*/
router.post("/image", uploadImage.single("image"), async (req, res) => {
 if (!req.file) {
   return res.status(400).json({ success: false, message: "No image uploaded" });
 }

 const protocol = req.headers["x-forwarded-proto"] || req.protocol;
 const tmpPath = req.file.path;
 const compressedFilename = `compressed-${Date.now()}-${req.file.originalname.replace(/\s+/g, "-")}`;
 const finalPath = path.join(uploadDir, compressedFilename);

 try {
   console.log("🔵 [UPLOAD-IMAGE] Checklist image received:", {
     originalName: req.file.originalname,
     mime: req.file.mimetype,
     tempPath: req.file.path,
   });
   await compressImage(tmpPath, finalPath);
   fs.unlinkSync(tmpPath);
   const url = `${protocol}://${req.get("host")}/uploads/${compressedFilename}`;
   console.log("🟢 [UPLOAD-IMAGE] Checklist image saved:", {
     savedAs: compressedFilename,
     publicUrl: url,
   });
   res.json({ success: true, url });
 } catch (err) {
   console.error("🔴 [IMG-COMPRESS-ERROR]", {
     file: req.file?.path,
     error: err.message,
   });
   await compressImage(tmpPath, finalPath);
   fs.unlinkSync(tmpPath);
   const url = `${protocol}://${req.get("host")}/uploads/${compressedFilename}`;
   res.json({ success: true, url });
 } catch (err) {
   console.error("Image compression failed:", err);
   try {
     const fallbackPath = path.join(uploadDir, req.file.filename);
     fs.renameSync(tmpPath, fallbackPath);
     const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
     res.json({ success: true, url });
   } catch (fallbackErr) {
     console.error("Image fallback failed:", fallbackErr);
     res.status(500).json({ success: false, message: "Image processing failed" });
   }
 }
});

/**
* POST /api/technician/uploads/audio
* field name: audio
*/
router.post("/audio", uploadAudio.single("audio"), (req, res) => {
 if (!req.file) {
   return res.status(400).json({ success: false, message: "No audio uploaded" });
 }

 const tmpPath = req.file.path;
 const finalPath = path.join(uploadDir, req.file.filename);
 fs.renameSync(tmpPath, finalPath);

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

 const tmpPath = req.file.path;
 const finalPath = path.join(uploadDir, req.file.filename);
 fs.renameSync(tmpPath, finalPath);

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

 const tmpPath = req.file.path;
 const finalPath = path.join(uploadDir, req.file.filename);
 fs.renameSync(tmpPath, finalPath);

 const protocol = req.headers["x-forwarded-proto"] || req.protocol;
 const url = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
 res.json({ success: true, url });
});

/* =====================================================
  🆕 POST /api/technician/uploads/obd
  accepts:
  - url (body)
  - file (optional)
  - images[] (optional)
===================================================== */
router.post(
 "/obd",
 uploadOBD.fields([
   { name: "file", maxCount: 1 },
   { name: "images", maxCount: 10 },
 ]),
 async (req, res) => {
   const protocol = req.headers["x-forwarded-proto"] || req.protocol;

   let fileUrl = null;

   if (req.files?.file?.[0]) {
     const f = req.files.file[0];
     if (f.mimetype.startsWith("image/")) {
       const tmpPath = f.path;
       const compressedFilename = `compressed-${Date.now()}-${f.originalname.replace(/\s+/g, "-")}`;
       const finalPath = path.join(uploadDir, compressedFilename);

       try {
         console.log("🔵 [UPLOAD-OBD-FILE] OBD image file received:", {
           originalName: f.originalname,
           mime: f.mimetype,
           tempPath: f.path,
         });
         await compressImage(tmpPath, finalPath);
         fs.unlinkSync(tmpPath);
         fileUrl = `${protocol}://${req.get("host")}/uploads/${compressedFilename}`;
         console.log("🟢 [UPLOAD-OBD-FILE] OBD image file saved:", {
           savedAs: compressedFilename,
           publicUrl: fileUrl,
         });
         await compressImage(tmpPath, finalPath);
         fs.unlinkSync(tmpPath);
         fileUrl = `${protocol}://${req.get("host")}/uploads/${compressedFilename}`;
       } catch (err) {
         console.error("Image compression failed:", err);
         const fallbackPath = path.join(uploadDir, f.filename);
         fs.renameSync(tmpPath, fallbackPath);
         fileUrl = `${protocol}://${req.get("host")}/uploads/${f.filename}`;
       }
     } else {
       const tmpPath = f.path;
       const finalPath = path.join(uploadDir, f.filename);
       fs.renameSync(tmpPath, finalPath);
       fileUrl = `${protocol}://${req.get("host")}/uploads/${f.filename}`;
     }
   }

   let images = [];

   if (req.files?.images) {
     for (const file of req.files.images) {
       const tmpPath = file.path;
       const compressedFilename = `compressed-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
       const finalPath = path.join(uploadDir, compressedFilename);

       try {
         console.log("🔵 [UPLOAD-OBD-IMAGE] OBD image received:", {
           originalName: file.originalname,
           mime: file.mimetype,
           tempPath: file.path,
         });
         await compressImage(tmpPath, finalPath);
         fs.unlinkSync(tmpPath);
         images.push(`${protocol}://${req.get("host")}/uploads/${compressedFilename}`);
         console.log("🟢 [UPLOAD-OBD-IMAGE] OBD image saved:", {
           savedAs: compressedFilename,
           publicUrl: images[images.length - 1],
         });
         await compressImage(tmpPath, finalPath);
         fs.unlinkSync(tmpPath);
         images.push(`${protocol}://${req.get("host")}/uploads/${compressedFilename}`);
       } catch (err) {
         console.error("Image compression failed:", err);
         const fallbackPath = path.join(uploadDir, file.filename);
         fs.renameSync(tmpPath, fallbackPath);
         images.push(`${protocol}://${req.get("host")}/uploads/${file.filename}`);
       }
     }
   }

   const { url } = req.body; // web OBD report link

   if (!url && !fileUrl && images.length === 0) {
     return res.status(400).json({
       success: false,
       message: "OBD requires url or file or images",
     });
   }

   res.json({
     success: true,
     obd: {
       url: url || null,
       fileUrl,
       images,
     },
   });
 }
);

router.use((err, req, res, next) => {
 console.error("Upload error:", err.message);

 res.status(400).json({
   success: false,
   message: err.message || "File upload failed",
 });
});


module.exports = router;
