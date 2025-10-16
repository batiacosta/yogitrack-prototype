const express = require("express");
const router = express.Router();
const managerController = require("../controllers/managerController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

// Manager CRUD operations
router.post("/create", verifyToken, managerController.createManager);
router.get("/get", verifyToken, managerController.getManager);
router.get("/all", verifyToken, managerController.getAllManagers);
router.get("/ids", verifyToken, managerController.getManagerIds);
router.get("/nextId", verifyToken, managerController.getNextManagerId);
router.put("/permissions/:managerId", verifyToken, managerController.updateManagerPermissions);
router.delete("/delete", verifyToken, managerController.deleteManager);

// Manager functionality - Instructor management
router.post("/instructor/add", verifyToken, managerController.addInstructor);
router.put("/instructor/update/:instructorId", verifyToken, managerController.updateInstructor);
router.delete("/instructor/remove/:instructorId", verifyToken, managerController.removeInstructor);

// Manager functionality - Class management
router.post("/class/add", verifyToken, managerController.addClass);
router.put("/class/update/:classId", verifyToken, managerController.updateClass);
router.delete("/class/remove/:classId", verifyToken, managerController.removeClass);

module.exports = router;
