const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.set("trust proxy", 1);

const uploadRoutes = require("./routes/upload.routes");

/* ================= CORS CONFIG (CLEAN FIX) ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://carboy-tech-frontend.onrender.com",
  "https://carboy-admin-frontend.onrender.com",
  "https://tech-api.mycarboy.in"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("⚠️ CORS blocked:", origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ LET NGINX HANDLE CORS — DO NOTHING IN EXPRESS
// (keep body parsers etc., but NO cors())

// // ✅ CORRECT FOR YOUR STACK
// app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));
/*
  👉 IMPORTANT RULE:
  - LOCAL → Express handles CORS
  - PRODUCTION → Nginx handles CORS
*/
if (process.env.NODE_ENV !== "production") {
  console.log("🟢 Using Express CORS (LOCAL)");
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
}

/* ================= BODY ================= */

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* ================= STATIC ================= */

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/technician/uploads", uploadRoutes);

/* ================= SWAGGER ================= */

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./src/docs/swagger.yaml");

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* ================= DEV ROUTES ================= */

if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", require("./routes/dev.routes"));
  console.log("🧪 Dev routes enabled:", "/api/dev");
}

/* ================= API ROUTES ================= */

const routes = require("./routes");
app.use("/api", routes);

module.exports = app;
