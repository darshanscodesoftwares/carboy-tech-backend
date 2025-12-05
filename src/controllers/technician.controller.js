// Technician Controller
// Exposes APIs for technician profile.

const technicianService = require('../services/technician.service');
const response = require('../utils/response');

module.exports = {

  // GET /me
  async getProfile(req, res, next) {
    try {
      const technicianId = req.user.id;
      const tech = await technicianService.getProfile(technicianId);
      return response.success(res, tech);
    } catch (err) {
      next(err);
    }
  }
};
