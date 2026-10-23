const express = require("express");
const cors = require("cors");
const classRoutes = require("./routes/classRoutes");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/classes", classRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Acad_Nexus backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
