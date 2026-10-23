const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
} = require("../controllers/classController");

router.post("/", createClass);
router.get("/", getClasses);
router.get("/:id", getClassById);

module.exports = router;