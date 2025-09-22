const Instructor = require("../models/instructorModel.cjs");

exports.search = async (req, res) => {
  try {
    const searchString = req.query.firstname;
    const instructor = await Instructor.find({
      firstname: { $regex: searchString, $options: "i" },
    });

    if (!instructor || instructor.length == 0) {
      return res.status(404).json({ message: "No instructor found" });
    } else {
      res.json(instructor[0]);
    }
  } catch (e) {
    res.status(400).json({error: e.message});
  }
};

//Find the package selected in the dropdown
exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const instructorDetail = await Instructor.findOne({ instructorId: instructorId });

    res.json(instructorDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const instructorJsonPath = path.join(__dirname, '../data/Instructor.json');
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      address,
      preferredContact
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !phone || !address || !preferredContact) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check for duplicate name
    const duplicate = await Instructor.findOne({ firstname, lastname });
    if (duplicate) {
      // Allow duplicates but warn frontend
      return res.status(409).json({ message: "Duplicate name found. Confirm to proceed.", duplicate: true });
    }

    // Generate new instructorId (Ixxxxx)
    let maxId = 0;
    const dbInstructors = await Instructor.find({});
    dbInstructors.forEach(inst => {
      if (inst.instructorId && /^I\d+$/.test(inst.instructorId)) {
        const num = parseInt(inst.instructorId.slice(1));
        if (num > maxId) maxId = num;
      }
    });
    // Also check JSON file
    if (fs.existsSync(instructorJsonPath)) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(instructorJsonPath, 'utf8'));
        jsonData.forEach(inst => {
          if (inst.instructorId && /^I\d+$/.test(inst.instructorId)) {
            const num = parseInt(inst.instructorId.slice(1));
            if (num > maxId) maxId = num;
          }
        });
      } catch (e) {}
    }
    const instructorId = 'I' + String(maxId + 1).padStart(5, '0');

    // Create a new instructor document
    const newInstructor = new Instructor({
      instructorId,
      firstname,
      lastname,
      address,
      phone,
      email,
      preferredContact
    });

    // Save to database
    await newInstructor.save();

    // Save to Instructor.json
    let jsonData = [];
    if (fs.existsSync(instructorJsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(instructorJsonPath, 'utf8'));
      } catch (e) {}
    }
    jsonData.push({
      instructorId,
      firstname,
      lastname,
      address,
      phone,
      email,
      preferredContact
    });
    fs.writeFileSync(instructorJsonPath, JSON.stringify(jsonData, null, 2));

    // Simulate sending confirmation message
    console.log(`Welcome to Yoga'Hom! ... Your instructor id is ${instructorId}.`);
    res.status(201).json({ message: "Instructor added successfully", instructorId });
  } catch (err) {
    console.error("Error adding instructor:", err.message);
    res.status(500).json({ message: "Failed to add instructor", error: err.message });
  }
};

//Populate the instructorId dropdown
exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find(
      {},
      { instructorId: 1, firstname: 1, lastname: 1, _id: 0 }
    ).sort();

    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  const lastInstructor = await Instructor.find({})
    .sort({ instructorId: -1 })
    .limit(1);

  let maxNumber = 1;
  if (lastInstructor.length > 0) {
    const lastId = lastInstructor[0].instructorId;
    const match = lastId.match(/\d+$/);
    if (match) {
      maxNumber = parseInt(match[0]) + 1;
    }
  }
  const nextId = `I${maxNumber}`;
  res.json({ nextId });
};

exports.deleteInstructor = async (req, res) => {
  try {
     const {instructorId} = req.query;
     const result = await Instructor.findOneAndDelete({ instructorId });
     if (!result) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    res.json({ message: "Instructor deleted", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
