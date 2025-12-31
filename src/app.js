const express = require('express');
const cors = require('cors');
const app = express();

// ------------------------
// CORS CONFIG (FIXED FOR LOCAL + RENDER)
// ------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'https://carboy-tech-frontend.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Explicitly handle preflight requests
app.options('*', cors());

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
