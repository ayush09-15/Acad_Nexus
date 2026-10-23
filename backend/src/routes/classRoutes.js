const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
} = require("../controllers/classController");

router.post("/", createClass);
router.get("/", getClasses);

module.exports = router;