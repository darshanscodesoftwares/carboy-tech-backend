// Seed script for CarBoy Technician Backend
// - Creates technicians with hashed passwords
// - Creates sample jobs assigned to technicians
// - Creates UCI + PDI checklist templates
//
// Run with: npm run seed

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDatabase } = require('../config/database');

const Technician = require('../models/technician.model');
const Job = require('../models/job.model');
const ChecklistTemplate = require('../models/checklist.model');

// Helper: Load JSON file
async function loadJson(fileName) {
  const filePath = path.join(__dirname, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function seed() {
  await connectDatabase();

  try {
    console.log('🧹 Clearing existing collections...');
    await Technician.deleteMany({});
    await Job.deleteMany({});
    await ChecklistTemplate.deleteMany({});

    // -------------------------------
    // 1) Seed Technicians
    // -------------------------------
    console.log('👨‍🔧 Seeding technicians...');
    const techniciansData = await loadJson('technicians.json');

    const techDocs = [];
    for (const tech of techniciansData) {
      // Pass plain password to passwordHash field
      // Pre-save hook will hash it automatically
      const doc = await Technician.create({
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        passwordHash: tech.passwordPlain,
        skills: tech.skills,
        status: tech.status,
      });

      techDocs.push(doc);
    }

    // -------------------------------
    // 2) Seed Jobs
    // -------------------------------
    console.log('🚗 Seeding jobs...');
    const jobsData = await loadJson('jobs.json');

    for (const job of jobsData) {
      const assignedTech = techDocs[job.assignedToIndex];

      await Job.create({
        serviceType: job.serviceType,
        customerSnapshot: job.customerSnapshot,
        vehicleSnapshot: job.vehicleSnapshot,
        schedule: job.schedule,
        location: job.location,
        status: job.status,
        technician: assignedTech ? assignedTech._id : null,
      });
    }

    // -------------------------------
    // 3) Seed UCI Checklist Template
    // -------------------------------
    console.log('📋 Seeding UCI checklist template...');
    const uciTemplate = await loadJson('checklist-uci.json');

    await ChecklistTemplate.create({
      serviceType: uciTemplate.serviceType,
      items: uciTemplate.items,
    });

    // -------------------------------
    // 4) Seed PDI Checklist Template
    // -------------------------------
    console.log('📋 Seeding PDI checklist template...');
    const pdiTemplate = await loadJson('checklist-pdi.json');

    await ChecklistTemplate.create({
      serviceType: pdiTemplate.serviceType,
      sections: pdiTemplate.sections,
    });

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

seed();
