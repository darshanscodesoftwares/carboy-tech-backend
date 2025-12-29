// Auth Service
// Validates technician credentials and generates JWT.

const technicianRepository = require('../repositories/technician.repository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = {
  async login(email, password) {
    const tech = await technicianRepository.findByEmail(email);
    if (!tech) {
      throw new Error('Technician not found');
    }

    const match = await bcrypt.compare(password, tech.passwordHash);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    // generate JWT
    const token = jwt.sign(
      { id: tech._id, role: 'technician' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      technician: {
        id: tech._id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        employeeId: tech.employeeId || 'TECH-' + tech._id.toString().slice(-4)
      }
    };
  }
};
