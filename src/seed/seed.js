// Seed script for CarBoy Technician Backend
// - Creates UCI + PDI checklist templates
//
// Run with: npm run seed

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

if (process.env.NODE_ENV === "production") {
  console.error("❌ Seeding is disabled in PRODUCTION environment");
  console.error("👉 Refusing to run seed.js");
  process.exit(1);
}

const { connectDatabase } = require('../config/database');

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
    await ChecklistTemplate.deleteMany({});

    // -------------------------------
    // 1) Seed UCI Checklist Template
    // -------------------------------
    console.log('📋 Seeding UCI checklist template...');
    const uciTemplate = await loadJson('checklist-uci.json');

    await ChecklistTemplate.create({
      serviceType: uciTemplate.serviceType,
      sections: uciTemplate.sections,
    });

    // -------------------------------
    // 2) Seed PDI Checklist Template
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
