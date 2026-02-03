// Job Controller
// Handles all job-related APIs for technician flow.

const jobService = require("../services/job.service");
const response = require("../utils/response");

module.exports = {
  // GET /jobs
  async listJobsByTechnician(req, res, next) {
    try {
      const technicianId = req.user.id;
      const { status } = req.query;
      const jobs = await jobService.listByTechnician(technicianId, status);
      return response.success(res, jobs);
    } catch (err) {
      next(err);
    }
  },

  // POST /jobs/:jobId/accept
  async acceptJob(req, res, next) {
    try {
      const technicianId = req.user.id;
      const jobId = req.params.jobId;
      const job = await jobService.acceptJob(jobId, technicianId);
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // GET /jobs/:jobId
  async getJobDetails(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const job = await jobService.getDetails(jobId);
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Start travel
  async startTravel(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const job = await jobService.updateStatus(jobId, "traveling");
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Reached location
  async reachedLocation(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const job = await jobService.updateStatus(jobId, "reached");
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Start inspection
  async startInspection(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const job = await jobService.updateStatus(jobId, "in_inspection");
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Fetch checklist
  async getChecklist(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const checklist = await jobService.getChecklist(jobId);
      return response.success(res, checklist);
    } catch (err) {
      next(err);
    }
  },

  // Submit checkpoint answer
  async submitCheckpoint(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const answer = req.body; // includes checkpointKey, selectedOption/value, notes, photoUrl
      const job = await jobService.submitCheckpoint(jobId, answer);
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Complete inspection
  async completeInspection(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const reportData = req.body;
      const report = await jobService.completeInspection(jobId, reportData);
      return response.success(res, report);
    } catch (err) {
      next(err);
    }
  },

  // Completed summary page
  async completedSummary(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const summary = await jobService.completedSummary(jobId);
      return response.success(res, summary);
    } catch (err) {
      next(err);
    }
  },

  // Reopen inspection for editing
  async reopenInspection(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const job = await jobService.reopenInspection(jobId);
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

  // Send report to admin (final submission)
  async sendReport(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const { remarks } = req.body || {};

      // ✅ ADD THIS LINE
      console.log("🟢 Tech BE controller received remarks:", remarks);

      const job = await jobService.sendReport(jobId, remarks);
      return response.success(res, job);
    } catch (err) {
      next(err);
    }
  },

async updateTechnicianRemarks(req, res, next) {
  try {
    const { jobId } = req.params;
    const { remarks = "" } = req.body;

    const result = await jobService.updateTechnicianRemarks(jobId, remarks);

    return response.success(res, result);
  } catch (err) {
    next(err); // let your global error handler handle it
  }
}

};
