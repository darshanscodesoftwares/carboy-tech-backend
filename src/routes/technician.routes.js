// Technician Routes
// These APIs are protected via authTechnician middleware.
// They represent the complete inspection lifecycle for a technician.

const express = require('express');
const router = express.Router();

const technicianController = require('../controllers/technician.controller');
const jobController = require('../controllers/job.controller');
const authController = require('../controllers/auth.controller');

const authTechnician = require('../middlewares/authTechnician');

// Auth
router.post('/auth/login', authController.login);
router.get('/me', authTechnician, technicianController.getProfile);

// Jobs list
router.get('/jobs', authTechnician, jobController.listJobsByTechnician);

// Accept job
router.post('/jobs/:jobId/accept', authTechnician, jobController.acceptJob);

// Job details
router.get('/jobs/:jobId', authTechnician, jobController.getJobDetails);

// Travel flow
router.post('/jobs/:jobId/start-travel', authTechnician, jobController.startTravel);
router.post('/jobs/:jobId/reached-location', authTechnician, jobController.reachedLocation);

// Inspection flow
router.post('/jobs/:jobId/start-inspection', authTechnician, jobController.startInspection);

// Checklist
router.get('/jobs/:jobId/checklist', authTechnician, jobController.getChecklist);
router.post('/jobs/:jobId/checkpoints', authTechnician, jobController.submitCheckpoint);

// Complete inspection
router.post('/jobs/:jobId/complete', authTechnician, jobController.completeInspection);
router.get('/jobs/:jobId/completed-summary', authTechnician, jobController.completedSummary);

// Reopen inspection for editing
router.post('/jobs/:jobId/reopen', authTechnician, jobController.reopenInspection);

module.exports = router;