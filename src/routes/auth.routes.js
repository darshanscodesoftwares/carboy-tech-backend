const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Technician login route
router.post('/login', authController.login);

module.exports = router;
