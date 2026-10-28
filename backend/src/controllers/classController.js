const crypto = require("crypto");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const ChatMessage = require("../models/ChatMessage");
const ChatSession = require("../models/ChatSession");

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

    const classes = await Class.find(filter)
      .populate("students", "name email createdAt")
      .sort({ createdAt: -1 });

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

    const classData = await Class.findOne(filter).populate(
      "students",
      "name email createdAt"
    );

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
    await ChatMessage.deleteMany({ classId: classData._id });
    await ChatSession.deleteMany({ classId: classData._id });

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

const chatWithClassAssistant = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, sessionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    let filter;
    if (req.user.role === "professor") {
      filter = { _id: id, professorId: req.user.id };
    } else if (req.user.role === "student") {
      filter = { _id: id, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this classroom chat.",
      });
    }

    const classData = await Class.findOne(filter).populate(
      "students",
      "name email createdAt"
    );
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    // Resolve or auto-create chat session
    let currentSession = null;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      currentSession = await ChatSession.findOne({
        _id: sessionId,
        classId: id,
        userId: req.user.id,
      });
    }

    if (!currentSession) {
      const trimmedQ = question.trim();
      const generatedTitle =
        trimmedQ.length > 40 ? trimmedQ.slice(0, 40) + "..." : trimmedQ;

      currentSession = await ChatSession.create({
        classId: id,
        userId: req.user.id,
        title: generatedTitle,
        lastMessageAt: new Date(),
      });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const aiResponse = await fetch(`${aiServiceUrl}/api/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: id,
        question: question.trim(),
      }),
    });

    if (!aiResponse.ok) {
      const errData = await aiResponse.json().catch(() => ({}));
      throw new Error(errData.detail || "AI service returned an error.");
    }

    const aiData = await aiResponse.json();

    // Persist conversational turn to MongoDB linked to this session
    let userMsgDoc = null;
    let assistantMsgDoc = null;
    try {
      [userMsgDoc, assistantMsgDoc] = await Promise.all([
        ChatMessage.create({
          sessionId: currentSession._id,
          classId: id,
          userId: req.user.id,
          role: "user",
          text: question.trim(),
        }),
        ChatMessage.create({
          sessionId: currentSession._id,
          classId: id,
          userId: req.user.id,
          role: "assistant",
          text: aiData.answer,
          citations: aiData.citations || [],
        }),
      ]);

      currentSession.lastMessageAt = new Date();
      await currentSession.save();
    } catch (dbErr) {
      console.warn("Failed to persist chat message to MongoDB:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: currentSession._id,
        sessionTitle: currentSession.title,
        question: question.trim(),
        answer: aiData.answer,
        citations: aiData.citations || [],
        sourcesCount: aiData.sources_count || 0,
        userMessageId: userMsgDoc?._id,
        assistantMessageId: assistantMsgDoc?._id,
      },
    });
  } catch (error) {
    console.error("Chat assistant error:", error.message);
    return res.status(500).json({
      success: false,
      message: "The AI teaching assistant is temporarily unavailable. Please verify the AI service is running.",
    });
  }
};

/**
 * Fetch all chat sessions of a particular user in a class.
 */
const getChatSessions = async (req, res) => {
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
      filter = { _id: id, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this classroom chat.",
      });
    }

    const classData = await Class.findOne(filter);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    const sessions = await ChatSession.find({
      classId: id,
      userId: req.user.id,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        lastMessageAt: s.lastMessageAt || s.updatedAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get chat sessions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching chat sessions.",
    });
  }
};

/**
 * Create a new empty chat session for a student in a class.
 */
const createChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

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
      filter = { _id: id, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create chat sessions for this class.",
      });
    }

    const classData = await Class.findOne(filter);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    const session = await ChatSession.create({
      classId: id,
      userId: req.user.id,
      title: title?.trim() || "New Chat",
      lastMessageAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Chat session created successfully.",
      data: {
        id: session._id.toString(),
        title: session.title,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("Create chat session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating chat session.",
    });
  }
};

/**
 * Get all messages for a specific chat session.
 */
const getSessionMessages = async (req, res) => {
  try {
    const { id, sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or session ID",
      });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      classId: id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
      });
    }

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      session: {
        id: session._id.toString(),
        title: session.title,
        lastMessageAt: session.lastMessageAt,
      },
      count: messages.length,
      data: messages.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        text: m.text,
        citations: m.citations || [],
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get session messages error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching session messages.",
    });
  }
};

/**
 * Delete a specific chat session and all its messages.
 */
const deleteChatSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or session ID",
      });
    }

    const session = await ChatSession.findOneAndDelete({
      _id: sessionId,
      classId: id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
      });
    }

    await ChatMessage.deleteMany({ sessionId });

    return res.status(200).json({
      success: true,
      message: "Chat session deleted successfully.",
      data: { id: sessionId },
    });
  } catch (error) {
    console.error("Delete chat session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting chat session.",
    });
  }
};

/**
 * Rename a specific chat session.
 */
const renameChatSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or session ID",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, classId: id, userId: req.user.id },
      { title: title.trim().slice(0, 100) },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat session renamed.",
      data: {
        id: session._id.toString(),
        title: session.title,
      },
    });
  } catch (error) {
    console.error("Rename chat session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error renaming chat session.",
    });
  }
};

/**
 * Fetch chat history of a particular user in a class (backward compatible).
 */
const getClassChatHistory = async (req, res) => {
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
      filter = { _id: id, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this classroom chat.",
      });
    }

    const classData = await Class.findOne(filter);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    const messages = await ChatMessage.find({
      classId: id,
      userId: req.user.id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        text: m.text,
        citations: m.citations || [],
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get class chat history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching chat history.",
    });
  }
};

/**
 * Clear chat history of a particular user in a class (backward compatible).
 */
const clearClassChatHistory = async (req, res) => {
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
      filter = { _id: id, students: req.user.id, isArchived: false };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to clear this classroom chat.",
      });
    }

    const classData = await Class.findOne(filter);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied.",
      });
    }

    await ChatMessage.deleteMany({
      classId: id,
      userId: req.user.id,
    });
    await ChatSession.deleteMany({
      classId: id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (error) {
    console.error("Clear class chat history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error clearing chat history.",
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
  chatWithClassAssistant,
  getClassChatHistory,
  clearClassChatHistory,
  getChatSessions,
  createChatSession,
  getSessionMessages,
  deleteChatSession,
  renameChatSession,
};


