// Inspection Report Repository
// Stores final inspection reports submitted by technician.

const InspectionReport = require('../models/inspection.model');

module.exports = {

  // create report
  async create(data) {
    const report = await InspectionReport.create(data);
    return report.toObject();
  },

  // find report by job
  async findByJob(jobId) {
    return InspectionReport.findOne({ jobId }).lean();
  },

  // update report
  async update(reportId, data) {
    return InspectionReport.findByIdAndUpdate(
      reportId,
      data,
      { new: true }
    ).lean();
  }
};
