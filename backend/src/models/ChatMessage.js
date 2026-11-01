const mongoose = require("mongoose");

const citationSchema = new mongoose.Schema(
  {
    document_title: {
      type: String,
      default: "",
    },
    page_number: {
      type: mongoose.Schema.Types.Mixed,
      default: 1,
    },
    score: {
      type: Number,
      default: 0,
    },
    chunk_id: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      index: true,
    },
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
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: [true, "Role must be user or assistant"],
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast retrieval of a student's conversation in a class ordered chronologically
chatMessageSchema.index({ classId: 1, userId: 1, createdAt: 1 });
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
