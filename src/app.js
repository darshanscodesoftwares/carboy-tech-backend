const express = require('express');
const app = express();

app.use(express.json());

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./src/docs/swagger.yaml');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// routes
const routes = require('./routes');
app.use('/api', routes);

module.exports = app;
