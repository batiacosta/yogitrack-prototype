const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.cjs");

// Public routes (no authentication required)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

// Protected routes (authentication required)
router.post("/change-password", authController.verifyToken, authController.changePassword);
router.get("/profile", authController.verifyToken, authController.getProfile);
router.post("/logout", authController.verifyToken, authController.logout);

module.exports = router;
