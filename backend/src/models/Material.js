const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Material title is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader ID is required"],
      index: true,
    },
    ragStatus: {
      type: String,
      enum: ["uploaded", "processing", "indexed", "failed"],
      default: "uploaded",
      index: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Material", materialSchema);
