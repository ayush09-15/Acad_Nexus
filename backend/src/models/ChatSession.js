const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: 120,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quickly querying a student's conversation sessions inside a class
chatSessionSchema.index({ classId: 1, userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
