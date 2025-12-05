// Job Repository
// Responsible for Job CRUD and status updates.
// Service layer uses these methods; DB queries are hidden here.

const Job = require('../models/job.model');

module.exports = {

  // create a job (used by admin/customer later)
  async create(data) {
    const job = await Job.create(data);
    return job.toObject();
  },

  // find job by ID
  async findById(id) {
    return Job.findById(id).lean();
  },

  // list jobs assigned to a technician
  async findByTechnician(technicianId, status) {
    const query = { technicianId };
    if (status) {
      query.status = status;
    }
    return Job.find(query)
      .sort({ createdAt: -1 })
      .lean();
  },

  // update job status
  async updateStatus(jobId, status) {
    return Job.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    ).lean();
  },

  // accept job
  async assignTechnician(jobId, technicianId) {
    return Job.findByIdAndUpdate(
      jobId,
      { technicianId, status: 'accepted' },
      { new: true }
    ).lean();
  },

  // add checkpoint answers (MVP/soft implementation)
  async addCheckpointAnswer(jobId, answer) {
    return Job.findByIdAndUpdate(
      jobId,
      { $push: { checklistAnswers: answer } },
      { new: true }
    ).lean();
  }
};
