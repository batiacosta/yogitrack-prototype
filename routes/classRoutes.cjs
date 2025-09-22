const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController.cjs");

router.post("/add", classController.addClass);
router.get("/list", classController.listClasses);

module.exports = router;
