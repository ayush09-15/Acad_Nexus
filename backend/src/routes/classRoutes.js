const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  joinClass,
  deleteClass,
} = require("../controllers/classController");

router.post("/", createClass);
router.post("/join", joinClass);
router.get("/", getClasses);
router.get("/:id", getClassById);
router.delete("/:id", deleteClass);

module.exports = router;