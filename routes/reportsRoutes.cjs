const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

// All report routes require authentication and manager permissions
router.get("/performance", verifyToken, reportsController.getPerformanceReport);
router.get("/instructor-performance", verifyToken, reportsController.getInstructorPerformanceReport);
router.get("/customer-attendance", verifyToken, reportsController.getCustomerAttendanceReport);
router.get("/general-attendance", verifyToken, reportsController.getGeneralAttendanceReport);

module.exports = router;