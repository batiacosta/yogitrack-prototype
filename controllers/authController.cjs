const User = require("../models/userModel.cjs");
const Manager = require("../models/managerModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const Password = require("../models/passwordModel.cjs");
const jwt = require("jsonwebtoken");

// Secret key for JWT (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "yoga-track-secret-key-2025";

// Register user with password
exports.register = async (req, res) => {
    try {
        console.log('Registration attempt:', { 
            body: req.body, 
            env: process.env.NODE_ENV,
            mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set'
        });
        
        const {
            firstname,
            lastname,
            email,
            phone,
            address,
            preferredContact,
            userType,
            password
        } = req.body;

        // Validate required fields
        if (!firstname || !lastname || !email || !phone || !address || !userType || !password) {
            return res.status(400).json({ 
                message: 'All fields are required: firstname, lastname, email, phone, address, userType, password' 
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
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
                message: 'Email already exists' 
            });
        }

        // Generate userId
        const userId = await User.generateUserId(userType);

        // Create user
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

        // Save user to database
        await newUser.save();

        // Create password record
        await Password.setPassword(userId, password);

        // Create role-specific records
        if (userType === 'Manager') {
            const managerId = await Manager.generateManagerId();
            const manager = new Manager({
                managerId,
                userId,
                department: 'Operations',
                isActive: true
            });
            await manager.save();
        } else if (userType === 'Instructor') {
            const instructorId = await Instructor.generateInstructorId();
            const instructor = new Instructor({
                instructorId,
                userId,
                specialties: [],
                isActive: true
            });
            await instructor.save();
        }

        // Send welcome message
        newUser.sendWelcomeMessage();

        res.status(201).json({ 
            message: `${userType} registered successfully`, 
            userId: userId,
            user: {
                userId,
                firstname,
                lastname,
                email,
                userType
            }
        });

    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', { 
            body: req.body,
            env: process.env.NODE_ENV,
            jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Using default'
        });
        
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Get password record
        const passwordRecord = await Password.findOne({ 
            userId: user.userId, 
            isActive: true 
        });
        
        if (!passwordRecord) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Validate password
        const isValidPassword = await passwordRecord.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.userId,
                email: user.email,
                userType: user.userType
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.userId,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                userType: user.userType
            }
        });

    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        // Validate input
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'userId, currentPassword, and newPassword are required' 
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Check if user exists
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Get current password record
        const passwordRecord = await Password.findOne({ 
            userId, 
            isActive: true 
        });
        
        if (!passwordRecord) {
            return res.status(401).json({ 
                message: 'No active password found' 
            });
        }

        // Validate current password
        const isValidCurrentPassword = await passwordRecord.validatePassword(currentPassword);
        if (!isValidCurrentPassword) {
            return res.status(401).json({ 
                message: 'Current password is incorrect' 
            });
        }

        // Set new password
        await Password.setPassword(userId, newPassword);

        res.json({
            message: 'Password changed successfully',
            userId
        });

    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Verify token middleware
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ 
            message: 'Invalid token' 
        });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.json({
            userId: user.userId,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            address: user.address,
            preferredContact: user.preferredContact,
            userType: user.userType
        });

    } catch (err) {
        console.error('Error getting profile:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

// Logout (client-side token removal, but we can blacklist token if needed)
exports.logout = (req, res) => {
    res.json({
        message: 'Logout successful. Please remove token from client storage.'
    });
};
