const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Admin-only: create a professor account.
const createProfessor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const professor = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "professor",
      professorApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: "Professor account created. Approval is required before login.",
      data: {
        user: {
          id: professor._id.toString(),
          name: professor.name,
          email: professor.email,
          role: professor.role,
          professorApproved: professor.professorApproved,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Create professor failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create professor account.",
    });
  }
};

// Admin-only: approve an existing professor.
const approveProfessor = async (req, res) => {
  try {
    const professor = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "professor",
      },
      { $set: { professorApproved: true } },
      { new: true, runValidators: true }
    ).select("_id name email role professorApproved");

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: "Professor account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Professor approved successfully.",
      data: {
        user: {
          id: professor._id.toString(),
          name: professor.name,
          email: professor.email,
          role: professor.role,
          professorApproved: professor.professorApproved,
        },
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid professor ID.",
      });
    }

    console.error("Approve professor failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to approve professor.",
    });
  }
};

module.exports = {
  createProfessor,
  approveProfessor,
};
