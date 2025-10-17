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
    let { className, instructorId, classType, description, daytime, capacity } = req.body;
    
    // If user is instructor, use their instructorId
    if (req.user.role === 'Instructor') {
      instructorId = req.user.instructorId;
    }
    
    if (!className || !instructorId || !classType || !Array.isArray(daytime) || daytime.length === 0) {
      return res.status(400).json({ message: 'All fields are required and at least one day/time.' });
    }

    // Check for instructor scheduling conflicts
    for (const dt of daytime) {
      const conflict = await Class.findOne({ 
        instructorId: instructorId,
        'daytime.day': dt.day, 
        'daytime.time': dt.time 
      });
      
      if (conflict) {
        // Get instructor details for better error message
        const Instructor = require("../models/instructorModel.cjs");
        const User = require("../models/userModel.cjs");
        
        const instructor = await Instructor.findOne({ instructorId: instructorId });
        let instructorName = instructorId; // fallback to ID
        
        if (instructor) {
          const user = await User.findOne({ userId: instructor.userId });
          if (user) {
            instructorName = `${user.firstname} ${user.lastname}`;
          }
        }
        
        return res.status(409).json({ 
          message: `Schedule conflict: Instructor ${instructorName} already has a class "${conflict.className}" on ${dt.day} at ${dt.time}`,
          conflictingClass: {
            classId: conflict.classId,
            className: conflict.className,
            day: dt.day,
            time: dt.time,
            instructorName: instructorName
          }
        });
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
      daytime,
      capacity: capacity || 20,
      registeredUsers: [],
      attendanceRecords: []
    });
    
    await newClass.save();
    
    // Update JSON file
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
      daytime,
      capacity: capacity || 20
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

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { className, instructorId, classType, description, daytime, capacity } = req.body;
    
    // Find the class to update
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has permission to update (instructor can only update their own classes)
    if (req.user.role === 'Instructor' && classDoc.instructorId !== req.user.instructorId) {
      return res.status(403).json({ message: 'You can only update your own classes' });
    }

    // Check for scheduling conflicts if daytime is being updated
    if (daytime && Array.isArray(daytime)) {
      for (const dt of daytime) {
        // Look for conflicts excluding current class
        const conflict = await Class.findOne({ 
          classId: { $ne: classId },
          instructorId: instructorId || classDoc.instructorId,
          'daytime.day': dt.day, 
          'daytime.time': dt.time 
        });
        
        if (conflict) {
          // Get instructor details for better error message
          const Instructor = require("../models/instructorModel.cjs");
          const User = require("../models/userModel.cjs");
          
          const currentInstructorId = instructorId || classDoc.instructorId;
          const instructor = await Instructor.findOne({ instructorId: currentInstructorId });
          let instructorName = currentInstructorId; // fallback to ID
          
          if (instructor) {
            const user = await User.findOne({ userId: instructor.userId });
            if (user) {
              instructorName = `${user.firstname} ${user.lastname}`;
            }
          }
          
          return res.status(409).json({ 
            message: `Schedule conflict: Instructor ${instructorName} already has a class "${conflict.className}" on ${dt.day} at ${dt.time}`,
            conflictingClass: {
              classId: conflict.classId,
              className: conflict.className,
              instructorName: instructorName
            }
          });
        }
      }
    }

    // Update class in database
    const updateData = {};
    if (className) updateData.className = className;
    if (instructorId) updateData.instructorId = instructorId;
    if (classType) updateData.classType = classType;
    if (description) updateData.description = description;
    if (daytime) updateData.daytime = daytime;
    if (capacity) updateData.capacity = capacity;

    await Class.updateOne({ classId }, updateData);

    // Update JSON file
    if (fs.existsSync(classJsonPath)) {
      try {
        let jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
        const classIndex = jsonData.findIndex(cls => cls.classId === classId);
        if (classIndex !== -1) {
          jsonData[classIndex] = { ...jsonData[classIndex], ...updateData };
          fs.writeFileSync(classJsonPath, JSON.stringify(jsonData, null, 2));
        }
      } catch (e) {
        console.error('Error updating JSON file:', e);
      }
    }

    res.json({ message: 'Class updated successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Find the class to delete
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has permission to delete (instructor can only delete their own classes)
    if (req.user.role === 'Instructor' && classDoc.instructorId !== req.user.instructorId) {
      return res.status(403).json({ message: 'You can only delete your own classes' });
    }

    // Check if class has registered users
    if (classDoc.registeredUsers && classDoc.registeredUsers.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete class with registered users. Please remove all registrations first.',
        registeredCount: classDoc.registeredUsers.length
      });
    }

    // Delete from database
    await Class.deleteOne({ classId });

    // Remove from JSON file
    if (fs.existsSync(classJsonPath)) {
      try {
        let jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
        jsonData = jsonData.filter(cls => cls.classId !== classId);
        fs.writeFileSync(classJsonPath, JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.error('Error updating JSON file:', e);
      }
    }

    res.json({ message: 'Class deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get user's class registrations
exports.getUserRegistrations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find all classes where the user is registered
    const classes = await Class.find({
      'registeredUsers.userId': userId
    }).sort({ 'registeredUsers.registrationDate': -1 });

    // Extract user's registrations with class details
    const userRegistrations = [];
    
    classes.forEach(classDoc => {
      const userReg = classDoc.registeredUsers.find(reg => reg.userId === userId);
      if (userReg) {
        userRegistrations.push({
          classId: classDoc.classId,
          className: classDoc.className,
          instructorId: classDoc.instructorId,
          classType: classDoc.classType,
          description: classDoc.description,
          daytime: classDoc.daytime,
          registrationDate: userReg.registrationDate,
          userPassId: userReg.userPassId,
          attended: classDoc.attendanceRecords.some(
            att => att.attendees.some(attendee => attendee.userId === userId)
          )
        });
      }
    });

    res.json(userRegistrations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
