const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "Announcement content is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["announcement", "assignment", "exam", "reminder"],
      default: "announcement",
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying classroom announcements sorted by pin status and date
announcementSchema.index({ classId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
