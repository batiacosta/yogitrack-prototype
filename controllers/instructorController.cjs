const Instructor = require("../models/instructorModel.cjs");
const User = require("../models/userModel.cjs");

exports.search = async (req, res) => {
  try {
    const searchString = req.query.firstname;
    
    // First find users with matching firstname
    const users = await User.find({
      firstname: { $regex: searchString, $options: "i" },
      userType: 'User'
    });

    if (!users || users.length == 0) {
      return res.status(404).json({ message: "No user found" });
    }

    // Get instructor details for the first matching user
    const instructor = await Instructor.findOne({ userId: users[0].userId }).populate('userId');
    
    if (!instructor) {
      return res.status(404).json({ message: "User is not an instructor" });
    }

    res.json(instructor);
  } catch (e) {
    res.status(400).json({error: e.message});
  }
};

//Find the instructor selected in the dropdown
exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const instructor = await Instructor.findOne({ instructorId: instructorId }).populate('userId');

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.json(instructor);
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
      userId,
      specializations,
      hireDate
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        message: 'UserId is required' 
      });
    }

    // Check if user exists and is not already an instructor
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found. User must be registered first.' 
      });
    }

    // Check if user is already an instructor
    const existingInstructor = await Instructor.findOne({ userId: userId });
    if (existingInstructor) {
      return res.status(409).json({ 
        message: 'User is already an instructor' 
      });
    }

    // Generate new instructorId
    const instructorId = await Instructor.generateInstructorId();

    // Create a new instructor document
    const newInstructor = new Instructor({
      instructorId,
      userId,
      classIds: [],
      specializations: specializations || [],
      hireDate: hireDate || new Date(),
      isActive: true
    });

    // Save to database
    await newInstructor.save();

    // Update user's userType to Instructor
    await User.findOneAndUpdate(
      { userId: userId },
      { userType: 'Instructor' }
    );

    // Save to Instructor.json
    let jsonData = [];
    if (fs.existsSync(instructorJsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(instructorJsonPath, 'utf8'));
      } catch (e) {}
    }
    
    const instructorData = {
      instructorId,
      userId,
      classIds: [],
      specializations: specializations || [],
      hireDate: hireDate || new Date(),
      isActive: true
    };
    
    jsonData.push(instructorData);
    fs.writeFileSync(instructorJsonPath, JSON.stringify(jsonData, null, 2));

    // Get full instructor details with user info
    const fullInstructor = await Instructor.findOne({ instructorId }).populate('userId');

    // Send confirmation message
    console.log(`Welcome to Yoga'Hom as an instructor! Your instructor id is ${instructorId}.`);
    
    res.status(201).json({ 
      message: "Instructor added successfully", 
      instructorId,
      instructor: fullInstructor
    });
    
  } catch (err) {
    console.error("Error adding instructor:", err.message);
    res.status(500).json({ 
      message: "Failed to add instructor", 
      error: err.message 
    });
  }
};

//Populate the instructorId dropdown
exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find({}, { instructorId: 1, userId: 1, _id: 0 })
      .populate('userId', 'firstname lastname')
      .sort();

    const instructorList = instructors.map(instructor => ({
      instructorId: instructor.instructorId,
      userId: instructor.userId._id,
      firstname: instructor.userId.firstname,
      lastname: instructor.userId.lastname
    }));

    res.json(instructorList);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const nextId = await Instructor.generateInstructorId();
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
     const {instructorId} = req.query;
     
     // Find the instructor first to get the userId
     const instructor = await Instructor.findOne({ instructorId });
     if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
     }
     
     // Delete the instructor record
     await Instructor.findOneAndDelete({ instructorId });
     
     // Update the user's userType back to 'User'
     await User.findOneAndUpdate(
       { userId: instructor.userId },
       { userType: 'User' }
     );
     
     res.json({ message: "Instructor deleted and user status updated", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
