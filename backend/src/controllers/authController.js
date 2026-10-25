const User = require("../models/User");
const Professor = require("../models/Professor");
const jwt = require("jsonwebtoken");

/**
 * Register a new user (Student or Professor).
 * Students are active immediately.
 * Professors are created with professorApproved: false (pending admin approval)
 * and have a linked record created in the Professor collection.
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, qualification, institution } = req.body;

    // Validate required fields.
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    // Validate password length.
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Role can be student or professor (admin is created via internal script only)
    const targetRole = role === "professor" ? "professor" : "student";
    const isProfessor = targetRole === "professor";

    // Create the base User authentication account
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: targetRole,
      professorApproved: false, // Pending admin approval
    });

    // Approach 2: If professor, create linked record in Professor collection
    let professorProfile = null;
    if (isProfessor) {
      professorProfile = await Professor.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        department: department?.trim() || "General Academics",
        designation: designation?.trim() || "Faculty Instructor",
        qualification: qualification?.trim() || "",
        institution: institution?.trim() || "Acad Nexus University",
        approvalStatus: "pending",
      });
    }

    return res.status(201).json({
      success: true,
      message: isProfessor
        ? "Professor account registered successfully. Your account is pending administrative approval before you can log in."
        : "Student registered successfully.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        professorApproved: user.professorApproved,
        professorProfile: professorProfile || undefined,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("User registration failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register account.",
    });
  }
};

// Log in an existing user.
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    // Use the same response for unknown emails and incorrect passwords.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Guard: Professor account must be approved by an administrator
    if (user.role === "professor" && !user.professorApproved) {
      return res.status(403).json({
        success: false,
        message:
          "Your professor account has not been approved yet. An administrator must approve your account before you can log in.",
      });
    }

    // If professor, retrieve their linked academic profile
    let professorProfile = null;
    if (user.role === "professor") {
      professorProfile = await Professor.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          professorApproved: user.professorApproved,
          department: professorProfile?.department || "General Academics",
          designation: professorProfile?.designation || "Faculty Instructor",
          qualification: professorProfile?.qualification || "",
          institution: professorProfile?.institution || "",
        },
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
};

const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  registerUser,
  registerStudent: registerUser, // Backward compatibility alias
  loginUser,
  getMe,
};
