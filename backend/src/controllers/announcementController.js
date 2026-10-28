const mongoose = require("mongoose");
const Class = require("../models/Class");
const Announcement = require("../models/Announcement");

/**
 * Create a new announcement or deadline for a class (Professor only).
 */
const createAnnouncement = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, content, category, priority, isPinned, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Announcement title is required.",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Announcement content is required.",
      });
    }

    const classroom = await Class.findById(classId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // Only the professor of this class or an admin can post announcements
    if (classroom.professorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the professor of this class can post announcements.",
      });
    }

    const validCategories = ["announcement", "assignment", "exam", "reminder"];
    const validPriorities = ["normal", "urgent"];

    let parsedDueDate = null;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        parsedDueDate = parsed;
      }
    }

    const announcement = await Announcement.create({
      classId,
      authorId: req.user.id,
      authorName: req.user.name,
      title: title.trim(),
      content: content.trim(),
      category: validCategories.includes(category) ? category : "announcement",
      priority: validPriorities.includes(priority) ? priority : "normal",
      isPinned: Boolean(isPinned),
      dueDate: parsedDueDate,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement posted successfully.",
      data: announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating announcement.",
    });
  }
};

/**
 * Fetch all announcements for a specific class (Enrolled students & Professor).
 */
const getClassAnnouncements = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    const classroom = await Class.findById(classId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    const isOwner = classroom.professorId.toString() === req.user.id;
    const isEnrolled = (classroom.students || []).some(
      (s) => s.toString() === req.user.id
    );
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in or managing this class.",
      });
    }

    const announcements = await Announcement.find({ classId })
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get class announcements error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching announcements.",
    });
  }
};

/**
 * Fetch latest announcements feed across all enrolled or owned classes.
 */
const getAnnouncementsFeed = async (req, res) => {
  try {
    let classIds = [];

    if (req.user.role === "professor") {
      const myClasses = await Class.find({ professorId: req.user.id }).select("_id");
      classIds = myClasses.map((c) => c._id);
    } else if (req.user.role === "student") {
      const enrolled = await Class.find({
        students: req.user.id,
        isArchived: false,
      }).select("_id");
      classIds = enrolled.map((c) => c._id);
    } else {
      const allClasses = await Class.find().select("_id");
      classIds = allClasses.map((c) => c._id);
    }

    const announcements = await Announcement.find({ classId: { $in: classIds } })
      .populate("classId", "name subject joinCode")
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get announcements feed error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching announcements feed.",
    });
  }
};

/**
 * Delete an announcement (Professor or Admin only).
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { classId, announcementId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(announcementId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or announcement ID.",
      });
    }

    const classroom = await Class.findById(classId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (classroom.professorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete announcements for this class.",
      });
    }

    const announcement = await Announcement.findOneAndDelete({
      _id: announcementId,
      classId,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("Delete announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting announcement.",
    });
  }
};

/**
 * Toggle pinned status for an announcement (Professor or Admin only).
 */
const togglePinAnnouncement = async (req, res) => {
  try {
    const { classId, announcementId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(announcementId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or announcement ID.",
      });
    }

    const classroom = await Class.findById(classId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (classroom.professorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to pin announcements for this class.",
      });
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      classId,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: announcement.isPinned
        ? "Announcement pinned to top."
        : "Announcement unpinned.",
      data: announcement,
    });
  } catch (error) {
    console.error("Toggle pin announcement error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error modifying announcement.",
    });
  }
};

module.exports = {
  createAnnouncement,
  getClassAnnouncements,
  getAnnouncementsFeed,
  deleteAnnouncement,
  togglePinAnnouncement,
};
