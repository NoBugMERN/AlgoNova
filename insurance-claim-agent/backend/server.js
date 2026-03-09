const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Import your custom routes
const ehrRoutes = require("./routes/ehr.routes");
const insuranceRoutes = require("./routes/insurance.routes");
const documentsRoutes = require("./routes/documents.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect the routes
app.use("/api/ehr", ehrRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/documents", documentsRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Member 2 API is locked and loaded on http://localhost:${PORT}`);
});