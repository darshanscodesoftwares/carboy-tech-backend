const express = require('express');
const cors = require('cors');
const app = express();

// ------------------------
// CORS CONFIG (EXPRESS 5 SAFE)
// ------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'https://carboy-tech-frontend.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server, Postman, mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
// DEV-ONLY ROUTES
// ------------------------
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
