const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

// Create a new user (public for now, but could be protected)
router.post("/create", userController.createUser);

// Get user by userId
router.get("/user/:userId", userController.getUserById);

// Get all users by type (protected)
router.get("/type/:userType", verifyToken, userController.getUsersByType);

// Get all users (protected)
router.get("/all", verifyToken, userController.getAllUsers);

// Get user IDs by type (for dropdowns) (protected)
router.get("/ids/:userType", verifyToken, userController.getUserIdsByType);

// Get next available ID for user type (protected)
router.get("/nextid/:userType", verifyToken, userController.getNextUserId);

// Get available users for instructor promotion (protected)
router.get("/available-for-instructor", verifyToken, userController.getAvailableUsersForInstructor);

// Get available users for manager promotion (protected)
router.get("/available-for-manager", verifyToken, userController.getAvailableUsersForManager);

// Update user (protected)
router.put("/update/:userId", verifyToken, userController.updateUser);

// Delete user (protected)
router.delete("/delete/:userId", verifyToken, userController.deleteUser);

module.exports = router;
