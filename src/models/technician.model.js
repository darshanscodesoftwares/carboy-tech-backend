// Technician Model (SQL-friendly structure)
// Note: We use normalized structure with references instead of deep embedding.
//      Later, switching to SQL DB will only require replacing repository layer.

const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
  // login / identity
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },

  // auth credentials
  passwordHash: { type: String, required: true },

  // Technician skill set (UCI, PDI, etc.)
  skills: [{ type: String, enum: ['UCI', 'PDI', 'VSH'] }],

  // Current status in the job flow
  status: {
    type: String,
    enum: ['idle', 'assigned', 'traveling', 'reached', 'in_inspection', 'completed'],
    default: 'idle'
  },

  // optional: track technician's locations (future)
  location: {
    lat: Number,
    lng: Number
  },

  // optional: admin notes
  notes: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Technician', TechnicianSchema);