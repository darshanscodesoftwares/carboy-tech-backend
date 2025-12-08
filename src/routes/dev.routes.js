const express = require('express');
const router = express.Router();
const Job = require('../models/job.model');

// Random data sources
const names = [
  "Prakash", "Arun Kumar", "Deepak", "Karthik", "Sanjay", "Rohit", "Vijay"
];

const phoneNumbers = [
  "9876543210", "9000033001", "9090123456", "9444412345", "9512345678"
];

const emails = [
  "test@example.com", "dummy@example.com", "user@example.com"
];

const brands = [
  { brand: "Hyundai", models: ["i20", "Creta", "Verna"] },
  { brand: "Maruti", models: ["Swift", "Baleno", "Fronx"] },
  { brand: "Honda", models: ["City", "Amaze"] },
  { brand: "Tata", models: ["Altroz", "Nexon"] },
];

const slots = ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"];
const locations = [
  {
    address: "Velachery, Chennai",
    lat: 13.0102,
    lng: 80.2126
  },
  {
    address: "T Nagar, Chennai",
    lat: 13.0418,
    lng: 80.2337
  },
  {
    address: "Gandhipuram, Coimbatore",
    lat: 11.0203,
    lng: 76.9663
  }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomYear() {
  return Math.floor(Math.random() * (2024 - 2016 + 1) + 2016);
}

router.post('/create-job', async (req, res) => {
  try {
    // Pick random brand + model
    const brandData = getRandomItem(brands);
    const model = getRandomItem(brandData.models);

    const job = await Job.create({
      serviceType: Math.random() > 0.5 ? "UCI" : "PDI",
      technicianId: "69326ab3310bf8eded74de23",
      customerSnapshot: {
        name: getRandomItem(names),
        phone: getRandomItem(phoneNumbers),
        email: getRandomItem(emails),
      },
      vehicleSnapshot: {
        brand: brandData.brand,
        model: model,
        year: getRandomYear(),
      },
      schedule: {
        date: "2025-12-" + String(Math.floor(Math.random() * 10) + 6).padStart(2, '0'),
        slot: getRandomItem(slots),
      },
      location: getRandomItem(locations),
      status: "pending"
    });

    res.json({ ok: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
