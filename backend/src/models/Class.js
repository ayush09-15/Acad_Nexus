
const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },

    subject: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Display name retained for frontend compatibility.
    professor: {
      type: String,
      required: [true, "Professor name is required"],
      trim: true,
    },

    // Actual owner of the class.
    professorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Professor ID is required"],
      index: true,
    },

    joinCode: {
      type: String,
      required: [true, "Join code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Class", classSchema);
