const crypto = require("crypto");
const Class = require("../models/Class");

const createClass = async (req, res) => {
  try {
    const { name, subject, description, professor } = req.body;

    if (!name?.trim() || !professor?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name and professor name are required",
      });
    }

    const joinCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const newClass = await Class.create({
      name: name.trim(),
      subject: subject || "",
      description: description || "",
      professor: professor.trim(),
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

module.exports = { createClass };