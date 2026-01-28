// Simple MongoDB connection using Mongoose
// NOTE: Keep connection logic here so seed + app both reuse it.

const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

    if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  // 👇 ADD THIS LINE HERE
  console.log(
    '🔗 MongoDB URI:',
    uri.includes('localhost') || uri.includes('127.0.0.1') ? 'LOCAL' : 'ATLAS'
  );

  try {
    await mongoose.connect(uri, {
      // you can tune options here if needed
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  connectDatabase
};
