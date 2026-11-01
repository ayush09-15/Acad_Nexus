const express = require("express");
const router = express.Router();

const {
  createProfessor,
  approveProfessor,
  revokeProfessor,
  deleteProfessor,
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

// Approve a professor account (support PATCH and PUT)
router.patch(
  "/professors/:id/approve",
  authenticateUser,
  authorizeRoles("admin"),
  approveProfessor
);
router.put(
  "/professors/:id/approve",
  authenticateUser,
  authorizeRoles("admin"),
  approveProfessor
);

// Revoke a professor's approval
router.patch(
  "/professors/:id/revoke",
  authenticateUser,
  authorizeRoles("admin"),
  revokeProfessor
);
router.put(
  "/professors/:id/revoke",
  authenticateUser,
  authorizeRoles("admin"),
  revokeProfessor
);

// Remove a professor account
router.delete(
  "/professors/:id",
  authenticateUser,
  authorizeRoles("admin"),
  deleteProfessor
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
