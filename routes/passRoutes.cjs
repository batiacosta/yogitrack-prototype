const express = require("express");
const router = express.Router();
const passController = require("../controllers/passController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

// Public routes (no authentication required)
router.get("/all", passController.getAllPasses);
router.get("/:passId", passController.getPassById);

// Protected routes (authentication required)

// Manager-only routes
router.post("/create", verifyToken, passController.createPass);
router.put("/update/:passId", verifyToken, passController.updatePass);
router.delete("/delete/:passId", verifyToken, passController.deletePass);

// User routes
router.post("/purchase/:passId", verifyToken, passController.purchasePass);
router.get("/user/my-passes", verifyToken, passController.getUserPasses);
router.get("/user/active-passes", verifyToken, passController.getUserActivePasses);
router.get("/user/check-valid", verifyToken, passController.checkValidPass);

module.exports = router;