const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController.cjs");
const { verifyToken } = require("../controllers/authController.cjs");

router.get("/getInstructor", verifyToken, instructorController.getInstructor);
router.get("/getNextId", verifyToken, instructorController.getNextId);
router.post("/add", verifyToken, instructorController.add);
router.get("/getInstructorIds", verifyToken, instructorController.getInstructorIds);
router.delete("/deleteInstructor", verifyToken, instructorController.deleteInstructor);

module.exports = router;
