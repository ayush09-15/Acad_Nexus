const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  getClassAnnouncements,
  getAnnouncementsFeed,
  deleteAnnouncement,
  togglePinAnnouncement,
} = require("../controllers/announcementController");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Global announcements feed across user's enrolled / teaching classes
router.get("/announcements/feed", authenticateUser, getAnnouncementsFeed);

// Classroom-specific announcements
router.post(
  "/classes/:classId/announcements",
  authenticateUser,
  authorizeRoles("professor", "admin"),
  createAnnouncement
);

router.get(
  "/classes/:classId/announcements",
  authenticateUser,
  getClassAnnouncements
);

router.delete(
  "/classes/:classId/announcements/:announcementId",
  authenticateUser,
  authorizeRoles("professor", "admin"),
  deleteAnnouncement
);

router.patch(
  "/classes/:classId/announcements/:announcementId/pin",
  authenticateUser,
  authorizeRoles("professor", "admin"),
  togglePinAnnouncement
);

module.exports = router;
