
const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  joinClass,
  deleteClass,
} = require("../controllers/classController");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Only approved, authenticated professors can create classes.
router.post(
  "/",
  authenticateUser,
  authorizeRoles("professor"),
  createClass
);

// Students must be authenticated to join a class.
router.post(
  "/join",
  authenticateUser,
  authorizeRoles("student"),
  joinClass
);

// Keep class reading available for authenticated users.
router.get("/", authenticateUser, getClasses);
router.get("/:id", authenticateUser, getClassById);

// Deletion will get an ownership check in the next step.
// Temporarily require authentication and professor role.
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("professor"),
  deleteClass
);

module.exports = router;
