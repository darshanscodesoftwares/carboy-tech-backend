// Inspection Report Model
// When technician completes inspection, this creates a report document.
// Job.status -> completed and Job.reportId points to this report.
// SQL migration: this will map to inspection_reports table.

const mongoose = require('mongoose');

const InspectionReportSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },

  // summary from technician
  summary: String,
  overallStatus: { type: String, enum: ['PASS', 'FAIL', 'ATTENTION'] },

  // embedded results (MVP)
  answers: [{
    checkpointKey: String,
    selectedOption: String,    // for radio/dropdown inputs
    value: String,              // for text/textarea inputs
    notes: String,
    photoUrl: String
  }],

  // recommendations or extra observations
  recommendations: [{
    text: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] }
  }],

  completedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('InspectionReport', InspectionReportSchema);
