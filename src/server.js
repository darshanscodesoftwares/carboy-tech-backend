/**
 * Entry point for Technician Backend
 * ----------------------------------
 * - Loads environment variables
 * - Connects to MongoDB
 * - Starts Express server
 * - Exposes backend to LAN / tunnel access
 */

require('dotenv').config();
const { connectDatabase } = require('./config/database');
const app = require('./app');

// ===============================
// Server Configuration
// ===============================
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0'; // 👈 IMPORTANT: exposes backend to LAN & tunnels

// ===============================
// Start Server
// ===============================
async function startServer() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDatabase(); // MUST complete before listening
    console.log('✅ Database connected');

    app.listen(PORT, HOST, () => {
      console.log('🚀 Technician Backend is running');
      console.log(`🌐 Local:   http://localhost:${PORT}`);
      console.log(`🌐 Network: http://${HOST}:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

startServer();
