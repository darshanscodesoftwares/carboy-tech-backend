const mongoose = require('mongoose');

const InspectionReportSchema = new mongoose.Schema({
  // 🔑 CRITICAL: Reference Job directly (NOT jobId)
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },

  // 🔑 Technician who performed inspection
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: true
  },

  // summary from technician
  summary: {
    type: String,
    default: ''
  },

  overallStatus: {
    type: String,
    enum: ['PASS', 'FAIL', 'ATTENTION'],
    default: null
  },

  // technician remarks/notes
  technicianRemarks: {
    type: String,
    default: ''
  },

  // embedded checklist answers (snapshot at submission time)
  checklistAnswers: [{
    checkpointKey: String,
    selectedOption: String,
    value: String,
    notes: String,
    photoUrl: String,
    photoUrls: [String]
  }],

  // recommendations or extra observations
  recommendations: [{
    text: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] }
  }],

  // when technician clicks "Send Report"
  submittedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InspectionReport', InspectionReportSchema);
