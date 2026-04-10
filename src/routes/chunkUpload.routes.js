const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { compressImage } = require("../utils/imageCompressor");

const uploadDir = path.join(__dirname, "../../uploads");
const tmpDir = path.join(__dirname, "../../uploads/tmp");
const chunkBaseDir = path.join(__dirname, "../../uploads/tmp/chunks");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
if (!fs.existsSync(chunkBaseDir)) {
  fs.mkdirSync(chunkBaseDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/**
 * POST /api/technician/uploads/chunk
 * Field name: chunk
 */
router.post("/chunk", upload.single("chunk"), async (req, res) => {
  try {
    const { fileId, chunkIndex, totalChunks, fileType, originalName } = req.body;

    if (!req.file || !fileId) {
      return res.status(400).json({
        success: false,
        message: "Missing file chunk or fileId",
      });
    }

    if (
      chunkIndex === undefined ||
      totalChunks === undefined ||
      !originalName ||
      !["image", "video"].includes(fileType)
    ) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Missing or invalid chunk metadata",
      });
    }

    const fileChunkDir = path.join(chunkBaseDir, fileId);
    if (!fs.existsSync(fileChunkDir)) {
      fs.mkdirSync(fileChunkDir, { recursive: true });
    }

    const chunkPath = path.join(fileChunkDir, `chunk-${chunkIndex}`);
    fs.renameSync(req.file.path, chunkPath);

    console.log("🟡 [CHUNK-RECEIVED]", {
      fileId,
      fileType,
      originalName,
      chunk: `${chunkIndex}/${totalChunks}`,
      storedAt: chunkPath,
    });

    if (Number(chunkIndex) < Number(totalChunks) - 1) {
      return res.json({
        success: true,
        message: "Chunk received",
        received: chunkIndex,
      });
    }

    console.log("🟠 [CHUNK-MERGE-START]", { fileId, totalChunks });

    const safeOriginalName = path.basename(originalName);
    const mergedPath = path.join(tmpDir, `${fileId}-${safeOriginalName}`);
    const writeStream = fs.createWriteStream(mergedPath);

    for (let i = 0; i < Number(totalChunks); i++) {
      const partPath = path.join(fileChunkDir, `chunk-${i}`);
      if (!fs.existsSync(partPath)) {
        writeStream.end();
        throw new Error(`Missing chunk-${i} during merge`);
      }
      const data = fs.readFileSync(partPath);
      writeStream.write(data);
    }

    writeStream.end();
    await new Promise((resolve) => writeStream.on("finish", resolve));

    fs.rmSync(fileChunkDir, { recursive: true, force: true });

    console.log("🟢 [CHUNK-MERGED]", {
      fileId,
      mergedFile: mergedPath,
      sizeKB: (fs.statSync(mergedPath).size / 1024).toFixed(2),
    });

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const compressedFilename = `compressed-${Date.now()}-${safeOriginalName.replace(/\s+/g, "-")}`;
    const finalPath = path.join(uploadDir, compressedFilename);

    try {
      if (fileType === "image") {
        console.log("🟡 [IMG-COMPRESS-START]", { file: mergedPath });
        await compressImage(mergedPath, finalPath);
        fs.unlinkSync(mergedPath);
      } else if (fileType === "video") {
        // Skip compression for chunked videos — just move directly
        // This prevents 361MB ffmpeg spike + timeout on slow connections
        console.log("🟡 [VIDEO-SKIP-COMPRESS]", { file: mergedPath, reason: "chunked upload" });
        fs.renameSync(mergedPath, finalPath);
      }

      const publicUrl = `${protocol}://${req.get("host")}/uploads/${compressedFilename}`;

      console.log("🟢 [UPLOAD-COMPLETE]", {
        fileId,
        type: fileType,
        savedAs: compressedFilename,
        publicUrl,
      });

      return res.json({
        success: true,
        url: publicUrl,
      });
    } catch (err) {
      console.error("🔴 [COMPRESS-ERROR]", {
        fileId,
        error: err.message,
      });

      const fallbackFilename = `${fileId}-${safeOriginalName}`;
      const fallbackPath = path.join(uploadDir, fallbackFilename);
      fs.renameSync(mergedPath, fallbackPath);

      const publicUrl = `${protocol}://${req.get("host")}/uploads/${fallbackFilename}`;

      console.warn("🟡 [UPLOAD-FALLBACK]", {
        fileId,
        originalFile: fallbackFilename,
        publicUrl,
      });

      return res.json({
        success: true,
        url: publicUrl,
      });
    }
  } catch (err) {
    console.error("🔴 [CHUNK-UPLOAD-ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Chunk upload failed",
    });
  }
});

setInterval(() => {
  try {
    console.log("🧹 [CLEANUP] Removing old chunk folders...");
    const folders = fs.readdirSync(chunkBaseDir);

    folders.forEach((folder) => {
      const fullPath = path.join(chunkBaseDir, folder);
      const stats = fs.statSync(fullPath);

      if (Date.now() - stats.mtimeMs > 60 * 60 * 1000) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log("🗑️ Deleted stale chunk folder:", folder);
      }
    });
  } catch (cleanupErr) {
    console.error("🔴 [CLEANUP-ERROR]", cleanupErr.message);
  }
}, 60 * 60 * 1000);

module.exports = router;
