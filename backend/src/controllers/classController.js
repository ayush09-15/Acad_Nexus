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
    let filter;

    if (req.user.role === "professor") {
      filter = { professorId: req.user.id };
    } else if (req.user.role === "student") {
      filter = { students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view classes",
      });
    }

    const classes = await Class.find(filter).sort({ createdAt: -1 });

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

    let filter;

    if (req.user.role === "professor") {
      filter = { _id: id, professorId: req.user.id };
    } else if (req.user.role === "student") {
      filter = { _id: id, students: req.user.id, isArchived: false, };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this class",
      });
    }

    const classData = await Class.findOne(filter);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not have access",
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

    if (typeof joinCode !== "string" || !joinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    const classData = await Class.findOne({
      joinCode: joinCode.trim().toUpperCase(),
      isArchived: false,
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Invalid join code or class not found",
      });
    }

    // Prevent the same student from joining twice.
    const alreadyEnrolled = classData.students.some(
      (studentId) => studentId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this class",
      });
    }

    // Save the authenticated student's ID in MongoDB.
    classData.students.push(req.user.id);
    await classData.save();

    return res.status(200).json({
      success: true,
      message: "Joined class successfully",
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

const leaveClass = async (req, res) => {
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

    const isEnrolled = classData.students.some(
      (studentId) => studentId.toString() === req.user.id
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    classData.students = classData.students.filter(
      (studentId) => studentId.toString() !== req.user.id
    );
    await classData.save();

    return res.status(200).json({
      success: true,
      message: "Left class successfully",
      data: { id: classData._id },
    });
  } catch (error) {
    console.error("Leave class error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const { name, subject, description } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Class name cannot be empty",
        });
      }
      updates.name = name.trim();
    }

    if (subject !== undefined) {
      if (typeof subject !== "string") {
        return res.status(400).json({
          success: false,
          message: "Subject must be a string",
        });
      }
      updates.subject = subject.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }
      updates.description = description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const classData = await Class.findOneAndUpdate(
      { _id: id, professorId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not own this class",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: classData,
    });
  } catch (error) {
    console.error("Update class error:", error.message);

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

const archiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findOneAndUpdate(
      { _id: id, professorId: req.user.id },
      { isArchived: true },
      { new: true, runValidators: true }
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not own this class.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class archived successfully",
      data: classData,
    });
  } catch (error) {
    console.error("Archive class error:", error.message);

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
  leaveClass,
  updateClass,
  deleteClass,
  archiveClass,
};


