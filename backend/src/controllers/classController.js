const crypto = require("crypto");
const mongoose = require("mongoose");
const Class = require("../models/Class");

const createClass = async (req, res) => {
  try {
    const { name, subject, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    // The authenticated professor's identity comes from the JWT.
    // Never trust a professor name or ID sent by the client.
    if (req.user.role !== "professor") {
      return res.status(403).json({
        success: false,
        message: "Only professors can create classes.",
      });
    }

    const joinCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const newClass = await Class.create({
      name: name.trim(),
      subject: subject?.trim() || "",
      description: description?.trim() || "",
      professor: req.user.name,
      professorId: req.user.id,
      joinCode,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate join code was generated. Please try again.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create class error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getClasses = async (req, res) => {
  try {
    // If the authenticated user is a student, only return classes they have enrolled in.
    let query = {};
    if (req.user?.role === "student") {
      query = { students: req.user.id };
    }

    const classes = await Class.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error("Get classes error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Get class by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    const classData = await Class.findOne({
      joinCode: joinCode.trim().toUpperCase(),
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Invalid join code or class not found",
      });
    }

    // Persist the student enrollment in MongoDB if not already added
    const studentId = req.user.id;
    const isEnrolled = classData.students.some(
      (id) => id.toString() === studentId
    );

    if (!isEnrolled) {
      classData.students.push(studentId);
      await classData.save();
    }

    return res.status(200).json({
      success: true,
      message: "Enrolled in class successfully",
      data: classData,
    });
  } catch (error) {
    console.error("Join class error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    // Find a class owned by the currently authenticated professor.
    const classData = await Class.findOne({
      _id: id,
      professorId: req.user.id,
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not own this class.",
      });
    }

    await Class.deleteOne({ _id: classData._id });

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      data: classData,
    });
  } catch (error) {
    console.error("Delete class error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  joinClass,
  deleteClass,
};
