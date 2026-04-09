// Technician Model (SQL-friendly structure)
// Note: We use normalized structure with references instead of deep embedding.
//      Later, switching to SQL DB will only require replacing repository layer.

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TechnicianSchema = new mongoose.Schema({
  // login / identity
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },

  // auth credentials
  passwordHash: { type: String, required: true, select: false },

  // Technician skill set (UCI, PDI, etc.)
  skills: [{ type: String, enum: ['UCI', 'PDI', 'VSH'] }],

  // Current status in the job flow
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'idle', 'assigned', 'traveling', 'reached', 'in_inspection', 'completed'],
    default: 'available'
  },

  district: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  assignedJobs: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  plainPassword: { type: String, default: '', select: false },

  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: '' },
  },

  // legacy field (tech backend original)
  location: {
    lat: Number,
    lng: Number
  },

  notes: [{ type: String }]
}, {
  timestamps: true
});

// Pre-save hook: Hash passwordHash if it was modified and not already hashed
TechnicianSchema.pre('save', async function() {
  // Only hash if passwordHash was modified
  if (!this.isModified('passwordHash')) {
    return;
  }

  // Check if already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.passwordHash && this.passwordHash.match(/^\$2[aby]\$/)) {
    return;
  }

  // Hash the plain password
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

module.exports = mongoose.model('Technician', TechnicianSchema);