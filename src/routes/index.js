const express = require('express');
const router = express.Router();

// AUTH ROUTES
router.use('/auth', require('./auth.routes'));

// JOB ROUTES
router.use('/jobs', require('./job.routes'));

// TECHNICIAN ROUTES
router.use('/technician', require('./technician.routes'));

// UPLOAD ROUTES
router.use('/upload', require('./upload.routes'));

module.exports = router;
