
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
  getClassChatHistory,
  clearClassChatHistory,
  getChatSessions,
  createChatSession,
  getSessionMessages,
  deleteChatSession,
  renameChatSession,
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

// Chat Sessions (ChatGPT-style multi-thread conversations)
router.get(
  "/:id/chat/sessions",
  authenticateUser,
  getChatSessions
);

router.post(
  "/:id/chat/sessions",
  authenticateUser,
  createChatSession
);

router.get(
  "/:id/chat/sessions/:sessionId",
  authenticateUser,
  getSessionMessages
);

router.delete(
  "/:id/chat/sessions/:sessionId",
  authenticateUser,
  deleteChatSession
);

router.patch(
  "/:id/chat/sessions/:sessionId",
  authenticateUser,
  renameChatSession
);

// Fetch document-grounded AI classroom chat history (backward compatible)
router.get(
  "/:id/chat",
  authenticateUser,
  getClassChatHistory
);

// Ask the document-grounded AI classroom assistant
router.post(
  "/:id/chat",
  authenticateUser,
  chatWithClassAssistant
);

// Clear document-grounded AI classroom chat history for this user
router.delete(
  "/:id/chat",
  authenticateUser,
  clearClassChatHistory
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
