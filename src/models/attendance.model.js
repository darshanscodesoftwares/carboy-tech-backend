const mongoose = require('mongoose');

// Same schema and collection as admin-backend — shared MongoDB in production
const attendanceSchema = new mongoose.Schema(
  {
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    date: { type: Date, required: true },
    selfieUrl: { type: String, default: null },
    selfieFilename: { type: String, default: null },
    submittedAt: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT'], default: 'PRESENT' },
  },
  { timestamps: true }
);

attendanceSchema.index({ technicianId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
