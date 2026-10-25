const express = require("express");
const router = express.Router();

const {
  createProfessor,
  approveProfessor,
  getProfessors,
  getStudents,
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
  createProfessor,
);

// Only admins can approve professor accounts.
router.patch(
  "/professors/:id/approve",
  authenticateUser,
  authorizeRoles("admin"),
  approveProfessor
);

router.get(
  "/professors",
  authenticateUser,
  authorizeRoles("admin"),
  getProfessors,
);

// Admin-only: list registered students
router.get(
  "/students",
  authenticateUser,
  authorizeRoles("admin"),
  getStudents,
);

module.exports = router;
