const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// 1. Import ONLY the routes that actually exist in your folder
const agentRoutes     = require("./routes/agent.routes");
const analyzeRoutes   = require("./routes/analyze.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const appealsRoutes   = require("./routes/appeals.routes");
const alertsRoutes    = require("./routes/alerts.routes");
const documentsRoutes = require("./routes/documents.routes");
const ehrRoutes       = require("./routes/ehr.routes");
const insuranceRoutes = require("./routes/insurance.routes");
const insurerRoutes   = require("./routes/insurer.routes");

const path = require("path");
const InsuranceLogicManager = require("../logic");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const logicManager = new InsuranceLogicManager({
  gapCsv: path.join(__dirname, "..", "data", "processed", "gap_analysis_data.csv"),
  riskCsv: path.join(__dirname, "..", "data", "processed", "risk_training_data.csv"),
  icdCsv: path.join(__dirname, "..", "data", "processed", "icd10_lookup_clean.csv"),
});

logicManager.init().then(() => {
  app.use((req, res, next) => {
    req.logicManager = logicManager;
    next();
  });

  // 2. Mount the routes
  app.use("/api/agent",      agentRoutes);
  app.use("/api/analyze",    analyzeRoutes);
  app.use("/api/analytics",  analyticsRoutes);
  app.use("/api/appeals",    appealsRoutes);
  app.use("/api/alerts",     alertsRoutes);
  app.use("/api/documents",  documentsRoutes);
  app.use("/api/ehr",        ehrRoutes);
  app.use("/api/insurance",  insuranceRoutes);
  app.use("/api/insurer",    insurerRoutes);

  // 3. Start the server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Express API running on port ${PORT}`);
    console.log(`Make sure FastAPI is running: python ai-engine/main.py`);
});
}).catch(err => {
  console.error("Failed to initialize LogicManager:", err);
  process.exit(1);
});
