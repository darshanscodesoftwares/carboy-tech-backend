// Checklist Template Model
// Stores the 100+ checkpoints for each service type.
// Technician fetches this to build UI checklist.

const mongoose = require('mongoose');

const ChecklistTemplateSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    enum: ['UCI', 'PDI', 'VSH'],
    required: true
  },

  // array of checkpoint items
  items: [{
    key: { type: String, required: true },      // id used in submission
    label: { type: String, required: true },    // display text
    options: [{ type: String }],                // choices
    requiresPhoto: { type: Boolean, default: false } // some checkpoints need photo
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
