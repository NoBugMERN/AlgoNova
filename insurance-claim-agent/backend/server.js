const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const patientRoutes = require("./routes/patient.routes");
const policyRoutes = require("./routes/policy.routes");
const documentsRoutes = require("./routes/documents.routes");
const analyzeRoutes = require("./routes/analyze.routes");
const riskRoutes = require("./routes/risk.routes");
const gapsRoutes = require("./routes/gaps.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/patient", patientRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/gaps", gapsRoutes);
app.use("/api/health", healthRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Member 2 API running on http://localhost:${PORT}`);
});