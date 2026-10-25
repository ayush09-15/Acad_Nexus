const Professor = require("../models/Professor");
const User = require("../models/User");

/**
 * Get current authenticated professor's profile.
 * Access: Authenticated professor.
 */
const getMyProfile = async (req, res) => {
  try {
    let profile = await Professor.findOne({ userId: req.user.id });

    // Fallback: if user registered before schema creation, create profile on the fly
    if (!profile) {
      profile = await Professor.create({
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        department: "General Academics",
        designation: "Faculty Instructor",
        approvalStatus: "approved",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get professor profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch professor profile.",
    });
  }
};

/**
 * Update authenticated professor's profile details.
 * Access: Authenticated professor.
 */
const updateMyProfile = async (req, res) => {
  try {
    const {
      department,
      designation,
      qualification,
      institution,
      cabinOffice,
      officeHours,
      bio,
    } = req.body;

    const updates = {};
    if (department !== undefined) updates.department = department.trim();
    if (designation !== undefined) updates.designation = designation.trim();
    if (qualification !== undefined) updates.qualification = qualification.trim();
    if (institution !== undefined) updates.institution = institution.trim();
    if (cabinOffice !== undefined) updates.cabinOffice = cabinOffice.trim();
    if (officeHours !== undefined) updates.officeHours = officeHours.trim();
    if (bio !== undefined) updates.bio = bio.trim();

    const profile = await Professor.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Professor profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update professor profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update professor profile.",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
