// Job Service
// Contains full business logic of job lifecycle.
// Uses repositories only (no direct DB calls).

const jobRepository = require('../repositories/job.repository');
const checklistRepository = require('../repositories/checklist.repository');
const inspectionRepository = require('../repositories/inspection.repository');
const technicianRepository = require('../repositories/technician.repository');

module.exports = {

  // list jobs
  async listByTechnician(technicianId, status) {
    return jobRepository.findByTechnician(technicianId, status);
  },

  // accept job
  async acceptJob(jobId, technicianId) {
    // update job and technician status
    const job = await jobRepository.assignTechnician(jobId, technicianId);
    await technicianRepository.updateStatus(technicianId, 'assigned');
    return job;
  },

  // get job details
  async getDetails(jobId) {
    return jobRepository.findById(jobId);
  },

  // update status
  async updateStatus(jobId, status) {
    const job = await jobRepository.updateStatus(jobId, status);

    // update technician status
    await technicianRepository.updateStatus(job.technicianId, status);

    return job;
  },

  // get checklist from template
  async getChecklist(jobId) {
    const job = await jobRepository.findById(jobId);
    return checklistRepository.findByService(job.serviceType);
  },

  // submit answer
  async submitCheckpoint(jobId, answer) {
    return jobRepository.addCheckpointAnswer(jobId, answer);
  },

  // complete inspection
  async completeInspection(jobId, reportData) {
    const job = await jobRepository.findById(jobId);

    // create report
    const report = await inspectionRepository.create({
      jobId,
      technicianId: job.technicianId,
      ...reportData
    });

    // update job status
    await jobRepository.updateStatus(jobId, 'completed');
    await technicianRepository.updateStatus(job.technicianId, 'completed');

    return report;
  },

  // summary
  async completedSummary(jobId) {
    const job = await jobRepository.findById(jobId);
    const report = await inspectionRepository.findByJob(jobId);

    return {
      job,
      report
    };
  }
};
