const express = require('express');
const router = express.Router();

router.use('/', require('./technician.routes'));

module.exports = router;