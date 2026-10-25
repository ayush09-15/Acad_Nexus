
const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  joinClass,
  leaveClass,
  updateClass,
  deleteClass,
  archiveClass,
  chatWithClassAssistant,
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

// Students can leave an enrolled class.
router.post(
  "/:id/leave",
  authenticateUser,
  authorizeRoles("student"),
  leaveClass
);

// Keep class reading available for authenticated users.
router.get("/", authenticateUser, getClasses);

router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("professor"),
  updateClass
);

router.patch(
  "/:id/archive",
  authenticateUser,
  authorizeRoles("professor"),
  archiveClass
);

router.get("/:id", authenticateUser, getClassById);

// Ask the document-grounded AI classroom assistant
router.post(
  "/:id/chat",
  authenticateUser,
  chatWithClassAssistant
);

// Deletion will get an ownership check in the next step.
// Temporarily require authentication and professor role.
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("professor"),
  deleteClass
);

module.exports = router;
