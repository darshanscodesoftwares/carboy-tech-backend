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
    const template = await checklistRepository.findByService(job.serviceType);

    // Return template with existing answers merged in
    return {
      ...template,
      existingAnswers: job.checklistAnswers || []
    };
  },

  // submit answer
  async submitCheckpoint(jobId, answer) {
    const job = await jobRepository.findById(jobId);

    if (!job) throw new Error("Job not found");

    if (!job.checklistAnswers) {
      job.checklistAnswers = [];
    }

    // Check if checkpoint already exists
    const index = job.checklistAnswers.findIndex(
      item => item.checkpointKey === answer.checkpointKey
    );

    if (index !== -1) {
      // UPDATE existing checkpoint
      job.checklistAnswers[index] = {
        ...job.checklistAnswers[index],
        ...answer
      };
    } else {
      // ADD new checkpoint
      job.checklistAnswers.push(answer);
    }

    const saved = await jobRepository.save(job);
    return saved;
  },

  // complete inspection
  async completeInspection(jobId, reportData) {
    const job = await jobRepository.findById(jobId);

    // create or update report
    let report = await inspectionRepository.findByJob(jobId);

    if (report) {
      // Update existing report
      report = await inspectionRepository.update(report._id, {
        ...reportData,
        checklistAnswers: job.checklistAnswers
      });
    } else {
      // Create new report
      report = await inspectionRepository.create({
        jobId,
        technicianId: job.technicianId,
        checklistAnswers: job.checklistAnswers,
        ...reportData
      });
    }

    // update job status to completed
    await jobRepository.updateStatus(jobId, 'completed');
    await technicianRepository.updateStatus(job.technicianId, 'completed');

    return report;
  },

  // reopen inspection for editing
  async reopenInspection(jobId) {
    const job = await jobRepository.findById(jobId);

    if (!job) throw new Error("Job not found");

    // Change status back to in_inspection to allow editing
    await jobRepository.updateStatus(jobId, 'in_inspection');
    await technicianRepository.updateStatus(job.technicianId, 'in_inspection');

    return job;
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
