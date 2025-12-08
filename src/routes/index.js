const express = require('express');
const router = express.Router();

// technician routes
router.use('/technician', require('./technician.routes'));

module.exports = router;
