const express = require("express");
const router = express.Router();

const {
  createProfessor,
  approveProfessor,
} = require("../controllers/adminController");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Only admins can create professor accounts.
router.post(
  "/professors",
  authenticateUser,
  authorizeRoles("admin"),
  createProfessor
);

// Only admins can approve professor accounts.
router.patch(
  "/professors/:id/approve",
  authenticateUser,
  authorizeRoles("admin"),
  approveProfessor
);

module.exports = router;
