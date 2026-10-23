const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");

const { registerStudent,
        loginUser,
        getMe,
    } = require("../controllers/authController");

router.post("/register", registerStudent);
router.post("/login", loginUser);
router.get("/me", authenticateUser, getMe);

module.exports = router;
