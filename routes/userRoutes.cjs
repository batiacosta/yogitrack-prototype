const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.cjs");

// Create a new user
router.post("/create", userController.createUser);

// Get user by userId
router.get("/user/:userId", userController.getUserById);

// Get all users by type
router.get("/type/:userType", userController.getUsersByType);

// Get all users
router.get("/all", userController.getAllUsers);

// Get user IDs by type (for dropdowns)
router.get("/ids/:userType", userController.getUserIdsByType);

// Get next available ID for user type
router.get("/nextid/:userType", userController.getNextUserId);

// Get available users for instructor promotion
router.get("/available-for-instructor", userController.getAvailableUsersForInstructor);

// Update user
router.put("/update/:userId", userController.updateUser);

// Delete user
router.delete("/delete/:userId", userController.deleteUser);

module.exports = router;
