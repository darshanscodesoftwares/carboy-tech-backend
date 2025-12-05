require('dotenv').config();
const { connectDatabase } = require('./config/database');
const app = require('./app');

const PORT = 5000;

async function start() {
  await connectDatabase();  // <--- THIS MUST RUN BEFORE app.listen()
  app.listen(PORT, () => {
    console.log(`Technician Backend running on port ${PORT}`);
  });
}

start();
