// Technician Repository
// This is the only file that knows Mongoose queries for Technician.
// All business logic goes via services, not directly accessing DB.

// NOTE: When we migrate to SQL, only this file will change.

const Technician = require('../models/technician.model');

module.exports = {

  // create new technician (admin created)
  async create(data) {
    const technician = await Technician.create(data);
    return technician.toObject(); // returns clean JS object
  },

  // login or fetch by email
  async findByEmail(email) {
    return Technician.findOne({ email }).lean();
  },

  // fetch by ID
  async findById(id) {
    return Technician.findById(id).lean();
  },

  // list all technicians
  async findAll() {
    return Technician.find().lean();
  },

  // update technician status
  async updateStatus(id, status) {
    return Technician.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
  }
};
