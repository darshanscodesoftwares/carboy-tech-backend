const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const authTechnician = require('../middlewares/authTechnician');

const tmpDir = path.resolve(__dirname, '../../uploads/tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({ dest: tmpDir, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/technician/jobs/:jobId/selfie — compress + forward to admin-backend
router.post('/:jobId/selfie', authTechnician, upload.single('selfie'), async (req, res) => {
  const { jobId } = req.params;
  const tmpPath = req.file?.path;
  const compressedPath = tmpPath ? tmpPath + '-compressed.jpg' : null;

  try {
    if (!tmpPath) return res.status(400).json({ success: false, message: 'selfie file is required' });

    await sharp(tmpPath)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(compressedPath);

    const form = new FormData();
    form.append('selfie', fs.createReadStream(compressedPath), { filename: 'selfie.jpg', contentType: 'image/jpeg' });

    const adminUrl = `${process.env.ADMIN_BACKEND_URL || 'http://localhost:5000'}/api/admin/jobs/${jobId}/selfie`;
    const response = await axios.post(adminUrl, form, { headers: form.getHeaders(), timeout: 15000 });

    return res.json({ success: true, data: response.data?.data, message: 'Selfie saved' });
  } catch (err) {
    console.error('[job-selfie] error:', err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({ success: false, message: err.response?.data?.message || 'Failed to save selfie' });
  } finally {
    try { if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
    try { if (compressedPath && fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath); } catch {}
  }
});

// POST /api/technician/jobs/:jobId/ie-denial — forward denial to admin-backend
router.post('/:jobId/ie-denial', authTechnician, async (req, res) => {
  const { jobId } = req.params;
  const { reason, note } = req.body;
  try {
    if (!reason) return res.status(400).json({ success: false, message: 'reason is required' });
    const adminUrl = `${process.env.ADMIN_BACKEND_URL || 'http://localhost:5000'}`;
    const response = await axios.patch(
      `${adminUrl}/api/admin/jobs/${jobId}/ie-denial`,
      { reason, note },
      { timeout: 10000 }
    );
    return res.json({ success: true, data: response.data?.data });
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json({ success: false, message: err.response?.data?.message || 'Failed to record denial' });
  }
});

module.exports = router;
