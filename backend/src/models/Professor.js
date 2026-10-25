const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Associated User ID is required"],
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Professor name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Institutional email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
      default: "General Academics",
    },

    designation: {
      type: String,
      trim: true,
      default: "Faculty Instructor", // e.g., Assistant Professor, Associate Professor, HOD
    },

    qualification: {
      type: String,
      trim: true,
      default: "", // e.g., Ph.D. in Computer Science, M.Tech
    },

    institution: {
      type: String,
      trim: true,
      default: "Acad Nexus University",
    },

    cabinOffice: {
      type: String,
      trim: true,
      default: "", // e.g., Academic Block 3, Room 402
    },

    officeHours: {
      type: String,
      trim: true,
      default: "", // e.g., Mon & Thu 3:00 PM - 5:00 PM
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Professor", professorSchema);
