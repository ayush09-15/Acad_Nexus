const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/professorController");
const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Authenticated professor profile routes
router.get(
  "/profile",
  authenticateUser,
  authorizeRoles("professor"),
  getMyProfile
);

router.put(
  "/profile",
  authenticateUser,
  authorizeRoles("professor"),
  updateMyProfile
);

module.exports = router;
