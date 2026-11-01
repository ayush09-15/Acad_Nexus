const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");

const {
  registerUser,
  registerStudent,
  loginUser,
  getMe,
} = require("../controllers/authController");

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/me", authenticateUser, getMe);

module.exports = router;
