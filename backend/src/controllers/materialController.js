const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Material = require("../models/Material");
const Class = require("../models/Class");

/**
 * Upload a PDF study material to a specific class.
 * Access: Professor who owns the class.
 */
const uploadMaterial = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded. Please select a valid .pdf document.",
      });
    }

    // Verify professor owns this class
    const classData = await Class.findOne({
      _id: classId,
      professorId: req.user.id,
    });

    if (!classData) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not have permission to upload materials.",
      });
    }

    const title = req.body.title?.trim() || req.file.originalname.replace(/\.pdf$/i, "");

    const material = await Material.create({
      title,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || "application/pdf",
      classId: classData._id,
      uploadedBy: req.user.id,
      ragStatus: "uploaded",
    });

    // Trigger background RAG vector indexing via AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    try {
      const aiResponse = await fetch(`${aiServiceUrl}/api/ai/ingest-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classData._id.toString(),
          material_id: material._id.toString(),
          document_title: title,
          file_path: path.resolve(req.file.path),
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        material.ragStatus = "indexed";
        material.chunkCount = aiData.chunks_indexed || 0;
        await material.save();
      }
    } catch {
      // AI service might be offline or starting up; material stays as 'uploaded'
    }

    return res.status(201).json({
      success: true,
      message: "Study material uploaded successfully and processed for RAG indexing.",
      data: material,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // ignore cleanup error
      }
    }
    console.error("Upload material error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to upload study material. Please try again.",
    });
  }
};

/**
 * Fetch all study materials for a classroom.
 * Access: Professor who owns the class OR enrolled student.
 */
const getClassMaterials = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    let classFilter;
    if (req.user.role === "professor") {
      classFilter = { _id: classId, professorId: req.user.id };
    } else if (req.user.role === "student") {
      classFilter = { _id: classId, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access materials for this class.",
      });
    }

    const classData = await Class.findOne(classFilter);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    const materials = await Material.find({ classId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error("Get materials error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching materials.",
    });
  }
};

/**
 * Delete a study material by ID.
 * Access: Professor who uploaded the material or owns the class.
 */
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
    }

    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found.",
      });
    }

    // Verify ownership
    const classData = await Class.findOne({
      _id: material.classId,
      professorId: req.user.id,
    });

    if (!classData && material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this material.",
      });
    }

    // Remove file from disk
    if (material.filePath && fs.existsSync(material.filePath)) {
      try {
        fs.unlinkSync(material.filePath);
      } catch (err) {
        console.warn("Could not delete file from disk:", err.message);
      }
    }

    await Material.findByIdAndDelete(id);

    // Remove vectors from AI vector store
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    try {
      await fetch(`${aiServiceUrl}/api/ai/materials/${id}`, {
        method: "DELETE",
      });
    } catch {
      // Non-blocking cleanup
    }

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Delete material error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting material.",
    });
  }
};

/**
 * Download a study material PDF.
 * Access: Authorized professor or enrolled student.
 */
const downloadMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
    }

    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found.",
      });
    }

    // Verify class access
    let classFilter;
    if (req.user.role === "professor") {
      classFilter = { _id: material.classId, professorId: req.user.id };
    } else if (req.user.role === "student") {
      classFilter = { _id: material.classId, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to download this material.",
      });
    }

    const classData = await Class.findOne(classFilter);
    if (!classData) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this material.",
      });
    }

    if (!material.filePath || !fs.existsSync(material.filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file is missing on server storage.",
      });
    }

    return res.download(material.filePath, material.originalName);
  } catch (error) {
    console.error("Download material error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error downloading material.",
    });
  }
};

module.exports = {
  uploadMaterial,
  getClassMaterials,
  deleteMaterial,
  downloadMaterial,
};
