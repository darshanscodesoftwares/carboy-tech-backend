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

  // array of checkpoint items (used for UCI, VSH - flat structure)
  items: [{
    key: { type: String, required: true },      // id used in submission
    label: { type: String, required: true },    // display text
    inputType: { type: String },                // text, textarea, radio, dropdown, image, multi-image
    options: [{ type: String }],                // choices
    requiresPhoto: { type: Boolean, default: false }, // some checkpoints need photo
    allowMultiplePhotos: { type: Boolean, default: false } // for multi-image uploads
  }],

  // sections-based structure (used for PDI - organized by sections)
  sections: [{
    section: { type: String, required: true },  // section name
    items: [{
      key: { type: String, required: true },    // id used in submission
      label: { type: String, required: true },  // display text
      inputType: { type: String, required: true }, // text, textarea, radio, dropdown, image, multi-image
      options: [{ type: String }],              // choices for radio/dropdown
      requiresPhoto: { type: Boolean, default: false }, // some checkpoints need photo
      allowMultiplePhotos: { type: Boolean, default: false } // for multi-image uploads
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
