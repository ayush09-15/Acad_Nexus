const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Professor = require("../models/Professor");

// Admin-only: create a professor account (auto-approved since an admin created it).
const createProfessor = async (req, res) => {
  try {
    const { name, email, password, department, designation, qualification, institution } = req.body;

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

    // 1. Create User account
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "professor",
      professorApproved: true,
    });

    // 2. Create linked Professor profile (Approach 2)
    const professorProfile = await Professor.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      department: department?.trim() || "General Academics",
      designation: designation?.trim() || "Faculty Instructor",
      qualification: qualification?.trim() || "",
      institution: institution?.trim() || "Acad Nexus University",
      approvalStatus: "approved",
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Professor account created and approved successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          professorApproved: user.professorApproved,
          department: professorProfile.department,
          designation: professorProfile.designation,
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

// Admin-only: approve a professor account.
const approveProfessor = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "professor",
      },
      { $set: { professorApproved: true } },
      { new: true, runValidators: true }
    ).select("_id name email role professorApproved");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professor account not found.",
      });
    }

    // Synchronize approval in the Professor collection
    const professorProfile = await Professor.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          approvalStatus: "approved",
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Professor approved successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          professorApproved: user.professorApproved,
          department: professorProfile.department,
          designation: professorProfile.designation,
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

// Admin-only: revoke approval for a professor account.
const revokeProfessor = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "professor",
      },
      { $set: { professorApproved: false } },
      { new: true, runValidators: true }
    ).select("_id name email role professorApproved");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professor account not found.",
      });
    }

    // Synchronize revocation in Professor collection
    await Professor.findOneAndUpdate(
      { userId: user._id },
      { $set: { approvalStatus: "pending", approvedAt: null } }
    );

    return res.status(200).json({
      success: true,
      message: "Professor access revoked successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          professorApproved: user.professorApproved,
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

    console.error("Revoke professor failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke professor access.",
    });
  }
};

// Admin-only: delete/reject a professor account.
const deleteProfessor = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: "professor",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professor account not found.",
      });
    }

    // Delete linked Professor profile
    await Professor.deleteOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "Professor account removed successfully.",
      data: { id: req.params.id },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid professor ID.",
      });
    }

    console.error("Delete professor failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete professor account.",
    });
  }
};

// Admin-only: fetch all professor accounts with linked Professor profile data.
const getProfessors = async (req, res) => {
  try {
    const users = await User.find({ role: "professor" })
      .select("_id name email role professorApproved createdAt")
      .sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);
    const profiles = await Professor.find({ userId: { $in: userIds } });
    const profileMap = new Map();
    for (const p of profiles) {
      profileMap.set(p.userId.toString(), p);
    }

    const professors = users.map((u) => {
      const p = profileMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        professorApproved: u.professorApproved,
        department: p?.department || "General Academics",
        designation: p?.designation || "Faculty Instructor",
        qualification: p?.qualification || "",
        institution: p?.institution || "Acad Nexus University",
        createdAt: u.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: professors.length,
      data: { professors },
    });
  } catch (error) {
    console.error("Fetch professors failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch professor accounts.",
    });
  }
};

// Admin-only: fetch all student accounts.
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: {
        students: students.map((student) => ({
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: student.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Fetch students failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student accounts.",
    });
  }
};

module.exports = {
  createProfessor,
  approveProfessor,
  revokeProfessor,
  deleteProfessor,
  getProfessors,
  getStudents,
};
