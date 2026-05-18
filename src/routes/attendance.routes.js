const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const authTechnician = require('../middlewares/authTechnician');
const Attendance = require('../models/attendance.model');

const tmpDir = path.resolve(__dirname, '../../uploads/tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const getISTMidnightUTC = (date = new Date()) => {
  const ist = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  ist.setHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
};

// GET /api/technician/attendance/today — direct DB read (shared MongoDB)
router.get('/today', authTechnician, async (req, res) => {
  try {
    const todayUTC = getISTMidnightUTC();
    const record = await Attendance.findOne({ technicianId: req.user.id, date: todayUTC }).lean();
    return res.json({ success: true, data: { attended: !!record, submittedAt: record?.submittedAt || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to check attendance' });
  }
});

// POST /api/technician/attendance — compress selfie + forward to admin-backend
router.post('/', authTechnician, upload.single('selfie'), async (req, res) => {
  const tmpPath = req.file?.path;
  const compressedPath = tmpPath ? tmpPath + '-compressed.jpg' : null;

  try {
    if (!tmpPath) return res.status(400).json({ success: false, message: 'selfie file is required' });

    // Check already attended today
    const todayUTC = getISTMidnightUTC();
    const existing = await Attendance.findOne({ technicianId: req.user.id, date: todayUTC }).lean();
    if (existing) return res.status(409).json({ success: false, message: 'Attendance already marked for today' });

    // Compress with Sharp
    await sharp(tmpPath)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(compressedPath);

    // Forward to admin-backend
    const form = new FormData();
    form.append('selfie', fs.createReadStream(compressedPath), { filename: 'selfie.jpg', contentType: 'image/jpeg' });
    form.append('technicianId', req.user.id);

    const adminUrl = `${process.env.ADMIN_BACKEND_URL || 'http://localhost:5000'}/api/admin/attendance/internal`;
    const response = await axios.post(adminUrl, form, { headers: form.getHeaders(), timeout: 15000 });

    return res.json({ success: true, data: response.data?.data, message: 'Attendance marked' });
  } catch (err) {
    console.error('[attendance] error:', err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({ success: false, message: err.response?.data?.message || 'Failed to mark attendance' });
  } finally {
    try { if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
    try { if (compressedPath && fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath); } catch {}
  }
});

module.exports = router;
