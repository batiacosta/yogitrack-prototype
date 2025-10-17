const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

// Public routes
router.get("/list", classController.listClasses);

// Protected routes (authentication required)
router.post("/add", verifyToken, classController.addClass);
router.put("/update/:classId", verifyToken, classController.updateClass);
router.delete("/delete/:classId", verifyToken, classController.deleteClass);
router.post("/register/:classId", verifyToken, classController.registerForClass);

// Instructor-only routes
router.get("/instructor/my-classes", verifyToken, classController.getInstructorClasses);
router.post("/attendance/:classId", verifyToken, classController.markAttendance);
router.get("/attendance/:classId", verifyToken, classController.getAttendance);

module.exports = router;
