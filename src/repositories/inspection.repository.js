// Inspection Report Repository
// Stores final inspection reports submitted by technician.

const InspectionReport = require('../models/inspection.model');

module.exports = {

  // =====================================================
  // CREATE REPORT
  // =====================================================
  async create(data) {
    const report = await InspectionReport.create(data);
    return report.toObject();
  },

  // =====================================================
  // FIND REPORT BY JOB (🔥 SINGLE SOURCE OF TRUTH 🔥)
  // =====================================================
  async findByJobId(jobId) {
    return InspectionReport.findOne({ job: jobId }).lean();
  },

  // =====================================================
  // UPDATE REPORT
  // =====================================================
  async update(reportId, data) {
    return InspectionReport.findByIdAndUpdate(
      reportId,
      data,
      { new: true }
    ).lean();
  }
};
