// Job Repository
// Clean, document-based, supports save().
// No `.lean()` anywhere for write operations.

const Job = require('../models/job.model');

module.exports = {

  // create job
  async create(data) {
    return Job.create(data); // returns document
  },

  // find job by ID (editable document)
  async findById(id) {
    return Job.findById(id); // DO NOT LEAN
  },

  // list jobs (read-only -> lean OK)
  async findByTechnician(technicianId, status) {
    const query = { technician: technicianId };
    if (status) query.status = status;

    return Job.find(query)
      .populate('technician', 'name')
      .populate('reportId')
      .sort({ createdAt: -1 })
      .lean(); // lean allowed because read only
  },

  // update status (lean ok because nothing to save again)
  async updateStatus(jobId, status) {
    return Job.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    ).lean();
  },

  // technician accepts job
  async assignTechnician(jobId, technicianId) {
    return Job.findByIdAndUpdate(
      jobId,
      { technician: technicianId, status: 'accepted' },
      { new: true }
    ).lean();
  },

  async updateById(jobId, updateData) {
  return Job.findByIdAndUpdate(
    jobId,
    updateData,
    { new: true }
  );
},

  // REMOVE $push — we manually update inside service
  async save(job) {
    return job.save(); // direct mongoose save
  }
};
