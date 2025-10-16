const User = require("../models/userModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const fs = require('fs');
const path = require('path');

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            email,
            phone,
            address,
            preferredContact,
            userType
        } = req.body;

        // Validate required fields
        if (!firstname || !lastname || !email || !phone || !address || !userType) {
            return res.status(400).json({ 
                message: 'All fields are required: firstname, lastname, email, phone, address, userType' 
            });
        }

        // Validate userType
        if (!['User', 'Instructor', 'Manager'].includes(userType)) {
            return res.status(400).json({ 
                message: 'userType must be User, Instructor, or Manager' 
            });
        }

        // Check for duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                message: 'User with this email already exists' 
            });
        }

        // Generate userId
        const userId = await User.generateUserId(userType);

        // Create user (Note: Instructors are created separately through instructor controller)
        const newUser = new User({
            userId,
            firstname,
            lastname,
            email,
            phone,
            address,
            preferredContact: preferredContact || 'email',
            userType
        });

        // Save to database
        await newUser.save();

        // Save to JSON file (backup)
        const jsonPath = path.join(__dirname, `../data/${userType}.json`);
        let jsonData = [];
        if (fs.existsSync(jsonPath)) {
            try {
                jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            } catch (e) {
                jsonData = [];
            }
        }

        const userData = newUser.toObject();
        delete userData._id;
        delete userData.__v;
        jsonData.push(userData);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

        // Send welcome message
        newUser.sendWelcomeMessage();

        res.status(201).json({ 
            message: `${userType} created successfully`, 
            userId: userId,
            user: userData
        });

    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get user by userId
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        let user;
        // Check if it's an instructor first
        if (userId.startsWith('I')) {
            user = await Instructor.findOne({ userId });
        } else {
            user = await User.findOne({ userId });
        }

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.json(user);

    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get all users by type
exports.getUsersByType = async (req, res) => {
    try {
        const { userType } = req.params;

        // Validate userType
        if (!['User', 'Instructor', 'Manager'].includes(userType)) {
            return res.status(400).json({ 
                message: 'userType must be User, Instructor, or Manager' 
            });
        }

        let users;
        if (userType === 'Instructor') {
            users = await Instructor.find({ userType });
        } else {
            users = await User.find({ userType });
        }

        res.json(users);

    } catch (err) {
        console.error('Error fetching users by type:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        // Get regular users and instructors
        const users = await User.find({});
        const instructors = await Instructor.find({});
        
        // Combine them
        const allUsers = [...users, ...instructors];

        res.json(allUsers);

    } catch (err) {
        console.error('Error fetching all users:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Don't allow changing userId or userType
        delete updateData.userId;
        delete updateData.userType;

        let user;
        // Check if it's an instructor
        if (userId.startsWith('I')) {
            user = await Instructor.findOneAndUpdate(
                { userId },
                updateData,
                { new: true, runValidators: true }
            );
        } else {
            user = await User.findOneAndUpdate(
                { userId },
                updateData,
                { new: true, runValidators: true }
            );
        }

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.json({ 
            message: 'User updated successfully', 
            user 
        });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        let user;
        // Check if it's an instructor
        if (userId.startsWith('I')) {
            user = await Instructor.findOneAndDelete({ userId });
        } else {
            user = await User.findOneAndDelete({ userId });
        }

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Update JSON file (remove from backup)
        const userType = user.userType;
        const jsonPath = path.join(__dirname, `../data/${userType}.json`);
        if (fs.existsSync(jsonPath)) {
            try {
                let jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                jsonData = jsonData.filter(item => item.userId !== userId);
                fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.error('Error updating JSON file:', e);
            }
        }

        res.json({ 
            message: `${userType} deleted successfully`, 
            userId 
        });

    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get user IDs by type (for dropdowns)
exports.getUserIdsByType = async (req, res) => {
    try {
        const { userType } = req.params;

        let users;
        if (userType === 'Instructor') {
            users = await Instructor.find({ userType }, 'userId firstname lastname');
        } else {
            users = await User.find({ userType }, 'userId firstname lastname');
        }

        const userIds = users.map(user => ({
            userId: user.userId,
            name: `${user.firstname} ${user.lastname}`
        }));

        res.json(userIds);

    } catch (err) {
        console.error('Error fetching user IDs:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get next available ID for a user type
exports.getNextUserId = async (req, res) => {
    try {
        const { userType } = req.params;

        if (!['User', 'Instructor', 'Manager'].includes(userType)) {
            return res.status(400).json({ 
                message: 'userType must be User, Instructor, or Manager' 
            });
        }

        const nextId = await User.generateUserId(userType);
        res.json({ nextId });

    } catch (err) {
        console.error('Error generating next user ID:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Get available users (those who are not instructors yet)
exports.getAvailableUsersForInstructor = async (req, res) => {
    try {
        // Get all users with userType 'User'
        const availableUsers = await User.find({ userType: 'User' });
        
        res.json(availableUsers);

    } catch (err) {
        console.error('Error fetching available users:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};
