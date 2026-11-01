const express = require("express");
const cors = require("cors");
const classRoutes = require("./routes/classRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const materialRoutes = require("./routes/materialRoutes");
const professorRoutes = require("./routes/professorRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("./config/db");

const app = express();

// Security Hardening: Disable Express fingerprinting header
app.disable("x-powered-by");

app.use(cors());
// Body parser with 10mb limit to protect against oversized payload DoS
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api", materialRoutes);
app.use("/api", announcementRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Acad_Nexus backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  };

  startServer();
}

module.exports = app;
