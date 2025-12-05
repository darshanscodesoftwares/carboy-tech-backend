// Auth Controller
// Handles technician login.
// Uses AuthService for JWT generation and credential validation.

const authService = require('../services/auth.service');
const response = require('../utils/response');

module.exports = {

  // login tech
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  }
};
