const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// ------------------------
// CORS CONFIG
// ------------------------
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ------------------------
// JSON Parsing
// ------------------------
app.use(express.json());

// ------------------------
// Swagger setup
// ------------------------
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./src/docs/swagger.yaml');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ------------------------
// Static Files - Serve uploads
// ------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ------------------------
// DEV-ONLY ROUTES
// ------------------------
// Only use this in local dev, not in production build
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', require('./routes/dev.routes'));
  console.log('🧪 Dev routes enabled:', '/api/dev');
}

// ------------------------
// API Routes
// ------------------------
const routes = require('./routes');
app.use('/api', routes);

module.exports = app;
