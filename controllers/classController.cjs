exports.listClasses = async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const fs = require('fs');
const path = require('path');
const Class = require('../models/classModel.cjs');
const User = require('../models/userModel.cjs');
const UserPass = require('../models/userPassModel.cjs');
const Instructor = require('../models/instructorModel.cjs');
const classJsonPath = path.join(__dirname, '../data/Class.json');

// new classId -> (Cxxxxx)
async function generateClassId() {
  let maxId = 0;
  const dbClasses = await Class.find({});
  dbClasses.forEach(cls => {
    if (cls.classId && /^C\d+$/.test(cls.classId)) {
      const num = parseInt(cls.classId.slice(1));
      if (num > maxId) maxId = num;
    }
  });
  if (fs.existsSync(classJsonPath)) {
    try {
      const jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
      jsonData.forEach(cls => {
        if (cls.classId && /^C\d+$/.test(cls.classId)) {
          const num = parseInt(cls.classId.slice(1));
          if (num > maxId) maxId = num;
        }
      });
    } catch (e) {}
  }
  return 'C' + String(maxId + 1).padStart(5, '0');
}

// Add Class
exports.addClass = async (req, res) => {
  try {
    const { className, instructorId, classType, description, daytime } = req.body;
    if (!className || !instructorId || !classType || !Array.isArray(daytime) || daytime.length === 0) {
      return res.status(400).json({ message: 'All fields are required and at least one day/time.' });
    }
    for (const dt of daytime) {
      const conflict = await Class.findOne({ 'daytime.day': dt.day, 'daytime.time': dt.time });
      if (conflict) {
        const hour = parseInt(dt.time.split(':')[0]);
        const alternatives = [];
        if (hour > 6) alternatives.push(`${hour - 1}:00`);
        if (hour < 20) alternatives.push(`${hour + 1}:00`);
        return res.status(409).json({ message: 'Schedule conflict found.', alternatives });
      }
    }
    // Generate new classId
    const classId = await generateClassId();
    const newClass = new Class({
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    });
    await newClass.save();
    let jsonData = [];
    if (fs.existsSync(classJsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
      } catch (e) {}
    }
    jsonData.push({
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    });
    fs.writeFileSync(classJsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`Class scheduled! Class id: ${classId}. Instructor: ${instructorId}`);
    res.status(201).json({ message: 'Class added successfully.', classId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Register user for a class
exports.registerForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { userPassId } = req.body;
    const userId = req.user.userId;

    // Find the class
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify user has a valid pass
    const userPass = await UserPass.findOne({ 
      userPassId, 
      userId, 
      isActive: true 
    });
    
    if (!userPass) {
      return res.status(400).json({ message: 'Valid pass required to register for class' });
    }

    // Check if pass has remaining sessions
    if (userPass.sessionsRemaining <= 0) {
      return res.status(400).json({ message: 'No sessions remaining on your pass' });
    }

    // Check if pass is expired
    if (new Date() > new Date(userPass.expirationDate)) {
      return res.status(400).json({ message: 'Your pass has expired' });
    }

    // Register user for class
    await classDoc.addRegistration(userId, userPassId);

    res.json({ 
      message: 'Successfully registered for class',
      class: classDoc
    });

  } catch (err) {
    if (err.message.includes('already registered') || err.message.includes('full capacity')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get classes for instructor (for attendance taking)
exports.getInstructorClasses = async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user.userId });
    if (!instructor) {
      return res.status(403).json({ message: 'Access denied. Instructor permissions required.' });
    }

    const classes = await Class.find({ 
      instructorId: instructor.instructorId,
      isActive: true 
    });

    // Manually populate registered users
    const populatedClasses = await Promise.all(
      classes.map(async (classDoc) => {
        const populatedRegistrations = await Promise.all(
          classDoc.registeredUsers.map(async (reg) => {
            const user = await User.findOne({ userId: reg.userId });
            return {
              ...reg.toObject(),
              userDetails: user ? {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
              } : null
            };
          })
        );
        
        return {
          ...classDoc.toObject(),
          registeredUsers: populatedRegistrations
        };
      })
    );

    res.json(populatedClasses);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark attendance for a class
exports.markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, attendees } = req.body;

    // Verify instructor owns this class
    const instructor = await Instructor.findOne({ userId: req.user.userId });
    if (!instructor) {
      return res.status(403).json({ message: 'Access denied. Instructor permissions required.' });
    }

    const classDoc = await Class.findOne({ 
      classId, 
      instructorId: instructor.instructorId 
    });
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    // Validate attendees are registered for the class
    const validAttendees = [];
    for (const attendee of attendees) {
      const registration = classDoc.registeredUsers.find(
        reg => reg.userId === attendee.userId
      );
      
      if (registration) {
        // Use session from user's pass
        const userPass = await UserPass.findOne({ 
          userPassId: registration.userPassId,
          userId: attendee.userId 
        });
        
        if (userPass && userPass.sessionsRemaining > 0) {
          // Deduct session from pass
          userPass.sessionsRemaining -= 1;
          await userPass.save();
          
          validAttendees.push({
            userId: attendee.userId,
            userPassId: registration.userPassId
          });
        }
      }
    }

    // Mark attendance
    await classDoc.markAttendance(date, validAttendees);

    res.json({ 
      message: 'Attendance marked successfully',
      attendeesCount: validAttendees.length,
      class: classDoc
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance for a specific class and date
exports.getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    // Verify instructor owns this class
    const instructor = await Instructor.findOne({ userId: req.user.userId });
    if (!instructor) {
      return res.status(403).json({ message: 'Access denied. Instructor permissions required.' });
    }

    const classDoc = await Class.findOne({ 
      classId, 
      instructorId: instructor.instructorId 
    });
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    const attendance = classDoc.getAttendanceForDate(date);
    
    res.json({ 
      class: {
        classId: classDoc.classId,
        className: classDoc.className
      },
      date,
      attendance: attendance || { attendees: [] }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
