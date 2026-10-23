const express = require("express");
const router = express.Router();

const { registerStudent,
        loginUser,
    } = require("../controllers/authController");

router.post("/register", registerStudent);
router.post("/login", loginUser);

module.exports = router;
