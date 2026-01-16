const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const uploadRoutes = require("./routes/upload.routes");


// ------------------------
// CORS CONFIG (EXPRESS 5 SAFE)
// ------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://carboy-tech-frontend.onrender.com',
  'https://carboy-admin-frontend.onrender.com',
  'http://192.168.29.224:5173',
];


app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, mobile apps, curl, Postman
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error('❌ CORS BLOCKED ORIGIN:', origin);
    return callback(null, false); // DO NOT throw Error
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options(/.*/, cors());


// ------------------------
// JSON Parsing
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static("uploads"));
app.use("/api/technician/uploads", uploadRoutes);


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
