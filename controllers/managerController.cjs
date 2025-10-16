const Manager = require("../models/managerModel.cjs");
const User = require("../models/userModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const Class = require("../models/classModel.cjs");
const fs = require('fs');
const path = require('path');

// Create a manager from existing user
exports.createManager = async (req, res) => {
    const managerJsonPath = path.join(__dirname, '../data/Manager.json');
    
    try {
        const {
            userId,
            department
        } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ 
                message: 'UserId is required' 
            });
        }

        // Check if user exists
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found. User must be registered first.' 
            });
        }

        // Check if user is already a manager
        const existingManager = await Manager.findOne({ userId: userId });
        if (existingManager) {
            return res.status(409).json({ 
                message: 'User is already a manager' 
            });
        }

        // Generate new managerId
        const managerId = await Manager.generateManagerId();

        // Create manager (simplified - all managers have full control)
        const newManager = new Manager({
            managerId,
            userId,
            department: department || 'Operations',
            isActive: true
        });

        // Save to database
        await newManager.save();

        // Update user's userType to Manager
        await User.findOneAndUpdate(
            { userId: userId },
            { userType: 'Manager' }
        );

        // Save to Manager.json
        let jsonData = [];
        if (fs.existsSync(managerJsonPath)) {
            try {
                jsonData = JSON.parse(fs.readFileSync(managerJsonPath, 'utf8'));
            } catch (e) {}
        }
        
        const managerData = {
            managerId,
            userId,
            department: department || 'Operations',
            isActive: true
        };
        
        jsonData.push(managerData);
        fs.writeFileSync(managerJsonPath, JSON.stringify(jsonData, null, 2));

        // Get full manager details with user info
        const fullManager = await Manager.findOne({ managerId }).populate('userId');

        console.log(`Welcome to Yoga'Hom as a manager! Your manager id is ${managerId}.`);
        
        res.status(201).json({ 
            message: "Manager created successfully", 
            managerId,
            manager: fullManager
        });
        
    } catch (err) {
        console.error("Error creating manager:", err.message);
        res.status(500).json({ 
            message: "Failed to create manager", 
            error: err.message 
        });
    }
};

// Get manager by managerId
exports.getManager = async (req, res) => {
    try {
        const managerId = req.query.managerId;
        const manager = await Manager.findOne({ managerId: managerId }).populate('userId');

        if (!manager) {
            return res.status(404).json({ message: "Manager not found" });
        }

        res.json(manager);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Get all managers
exports.getAllManagers = async (req, res) => {
    try {
        const managers = await Manager.find({}).populate('userId');
        res.json(managers);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Get manager IDs for dropdown
exports.getManagerIds = async (req, res) => {
    try {
        const managers = await Manager.find({}, { managerId: 1, userId: 1, _id: 0 })
            .populate('userId', 'firstname lastname')
            .sort();

        const managerList = managers.map(manager => ({
            managerId: manager.managerId,
            userId: manager.userId._id,
            firstname: manager.userId.firstname,
            lastname: manager.userId.lastname
        }));

        res.json(managerList);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Update manager (simplified)
exports.updateManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        const { department } = req.body;

        const manager = await Manager.findOneAndUpdate(
            { managerId },
            { department },
            { new: true }
        ).populate('userId');

        if (!manager) {
            return res.status(404).json({ message: "Manager not found" });
        }

        res.json({ 
            message: "Manager updated successfully", 
            manager 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete manager
exports.deleteManager = async (req, res) => {
    try {
        const { managerId } = req.query;
        
        // Find the manager first to get the userId
        const manager = await Manager.findOne({ managerId });
        if (!manager) {
            return res.status(404).json({ error: "Manager not found" });
        }
        
        // Delete the manager record
        await Manager.findOneAndDelete({ managerId });
        
        // Update the user's userType back to 'User'
        await User.findOneAndUpdate(
            { userId: manager.userId },
            { userType: 'User' }
        );
        
        res.json({ 
            message: "Manager deleted and user status updated", 
            managerId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manager functionality - Add Instructor
exports.addInstructor = async (req, res) => {
    try {
        // Check if the requesting user is an active manager
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { userId, specializations, hireDate } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ message: 'UserId is required' });
        }

        // Check if user exists
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

        // Create instructor
        const newInstructor = new Instructor({
            instructorId,
            userId,
            classIds: [],
            specializations: specializations || [],
            hireDate: hireDate || new Date(),
            isActive: true
        });

        await newInstructor.save();

        // Update user's userType to Instructor
        await User.findOneAndUpdate(
            { userId: userId },
            { userType: 'Instructor' }
        );

        const fullInstructor = await Instructor.findOne({ instructorId }).populate('userId');

        res.status(201).json({ 
            message: "Instructor added successfully by manager", 
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

// Manager functionality - Update Instructor
exports.updateInstructor = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { instructorId } = req.params;
        const updateData = req.body;

        // Don't allow changing instructorId or userId
        delete updateData.instructorId;
        delete updateData.userId;

        const instructor = await Instructor.findOneAndUpdate(
            { instructorId },
            updateData,
            { new: true, runValidators: true }
        ).populate('userId');

        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        res.json({ 
            message: 'Instructor updated successfully by manager', 
            instructor 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manager functionality - Remove Instructor
exports.removeInstructor = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { instructorId } = req.params;
        
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
        
        res.json({ 
            message: "Instructor removed successfully by manager", 
            instructorId 
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manager functionality - Add Class
exports.addClass = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { className, instructorId, classType, description, daytime } = req.body;
        
        if (!className || !instructorId || !classType || !Array.isArray(daytime) || daytime.length === 0) {
            return res.status(400).json({ 
                message: 'All fields are required and at least one day/time.' 
            });
        }

        // Check for schedule conflicts
        for (const dt of daytime) {
            const conflict = await Class.findOne({ 
                'daytime.day': dt.day, 
                'daytime.time': dt.time 
            });
            if (conflict) {
                return res.status(409).json({ 
                    message: 'Schedule conflict found.',
                    conflictWith: conflict.className
                });
            }
        }

        // Generate class ID (assuming you have this function in classController)
        const classJsonPath = path.join(__dirname, '../data/Class.json');
        let maxId = 0;
        const dbClasses = await Class.find({});
        dbClasses.forEach(cls => {
            if (cls.classId && /^C\d+$/.test(cls.classId)) {
                const num = parseInt(cls.classId.slice(1));
                if (num > maxId) maxId = num;
            }
        });
        const classId = 'C' + String(maxId + 1).padStart(5, '0');

        const newClass = new Class({
            classId,
            className,
            instructorId,
            classType,
            description,
            daytime
        });

        await newClass.save();

        // Add class to instructor's class list
        await Instructor.findOneAndUpdate(
            { instructorId },
            { $push: { classIds: classId } }
        );

        res.status(201).json({ 
            message: 'Class added successfully by manager', 
            classId,
            class: newClass
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manager functionality - Update Class
exports.updateClass = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { classId } = req.params;
        const updateData = req.body;

        // Don't allow changing classId
        delete updateData.classId;

        const updatedClass = await Class.findOneAndUpdate(
            { classId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json({ 
            message: 'Class updated successfully by manager', 
            class: updatedClass 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manager functionality - Remove Class
exports.removeClass = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { classId } = req.params;
        
        const classToDelete = await Class.findOne({ classId });
        if (!classToDelete) {
            return res.status(404).json({ error: "Class not found" });
        }
        
        // Remove class from instructor's class list
        await Instructor.findOneAndUpdate(
            { instructorId: classToDelete.instructorId },
            { $pull: { classIds: classId } }
        );

        // Delete the class
        await Class.findOneAndDelete({ classId });
        
        res.json({ 
            message: "Class removed successfully by manager", 
            classId 
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get next manager ID
exports.getNextManagerId = async (req, res) => {
    try {
        const nextId = await Manager.generateManagerId();
        res.json({ nextId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
