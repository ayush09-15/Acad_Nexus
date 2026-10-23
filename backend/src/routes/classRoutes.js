const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  joinClass,
} = require("../controllers/classController");

router.post("/", createClass);
router.post("/join", joinClass);
router.get("/", getClasses);
router.get("/:id", getClassById);

module.exports = router;