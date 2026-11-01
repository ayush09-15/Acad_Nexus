const express = require("express");
const router = express.Router();

const {
  uploadMaterial,
  getClassMaterials,
  deleteMaterial,
  downloadMaterial,
} = require("../controllers/materialController");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");
const { uploadLimiter } = require("../middleware/rateLimitMiddleware");

// Upload PDF study material for a specific classroom (professor-only, rate-limited)
router.post(
  "/classes/:classId/materials",
  authenticateUser,
  authorizeRoles("professor"),
  uploadLimiter,
  upload.single("file"),
  uploadMaterial
);

// Get all study materials for a classroom (professor & enrolled students)
router.get(
  "/classes/:classId/materials",
  authenticateUser,
  getClassMaterials
);

// Delete a study material (professor-only)
router.delete(
  "/materials/:id",
  authenticateUser,
  authorizeRoles("professor"),
  deleteMaterial
);

// Download a study material PDF
router.get(
  "/materials/:id/download",
  authenticateUser,
  downloadMaterial
);

module.exports = router;
