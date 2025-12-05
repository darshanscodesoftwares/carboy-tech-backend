// Checklist Repository
// Fetch 100+ checkpoints for UCI/PDI/VSH types.

const ChecklistTemplate = require('../models/checklist.model');

module.exports = {

  // Get checklist by service type
  async findByService(serviceType) {
    return ChecklistTemplate.findOne({ serviceType }).lean();
  },

  // Admin can update checklist later
  async update(serviceType, items) {
    return ChecklistTemplate.findOneAndUpdate(
      { serviceType },
      { items },
      { new: true }
    ).lean();
  },

  // seed template
  async create(data) {
    return ChecklistTemplate.create(data);
  }
};
