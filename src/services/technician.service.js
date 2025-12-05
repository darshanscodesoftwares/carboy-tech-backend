// Technician Service
// Provides profile information.

const technicianRepository = require('../repositories/technician.repository');

module.exports = {
  async getProfile(technicianId) {
    return technicianRepository.findById(technicianId);
  }
};
