const Pass = require("../models/passModel.cjs");
const UserPass = require("../models/userPassModel.cjs");
const Manager = require("../models/managerModel.cjs");
const User = require("../models/userModel.cjs");

// Manager-only operations

// Create a new pass (Manager only)
exports.createPass = async (req, res) => {
    try {
        // Check if the requesting user is an active manager
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { name, description, duration, sessions, price } = req.body;

        // Validation
        if (!name || !duration || !sessions || price === undefined) {
            return res.status(400).json({ 
                message: 'Name, duration, sessions, and price are required' 
            });
        }

        if (!duration.value || !duration.unit) {
            return res.status(400).json({ 
                message: 'Duration must include value and unit' 
            });
        }

        // Generate next pass ID
        const passId = await Pass.getNextPassId();

        const newPass = new Pass({
            passId,
            name,
            description,
            duration,
            sessions,
            price,
            createdBy: req.user.userId
        });

        await newPass.save();

        res.status(201).json({
            message: 'Pass created successfully',
            pass: newPass
        });

    } catch (error) {
        console.error('Create pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all passes (Public - for users to see available passes)
exports.getAllPasses = async (req, res) => {
    try {
        const passes = await Pass.getActivePasses();
        res.json(passes);
    } catch (error) {
        console.error('Get passes error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pass by ID
exports.getPassById = async (req, res) => {
    try {
        const { passId } = req.params;
        const pass = await Pass.findOne({ passId, isActive: true });
        
        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        res.json(pass);
    } catch (error) {
        console.error('Get pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update pass (Manager only)
exports.updatePass = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { passId } = req.params;
        const updateData = req.body;

        // Don't allow changing passId or createdBy
        delete updateData.passId;
        delete updateData.createdBy;

        const updatedPass = await Pass.findOneAndUpdate(
            { passId },
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!updatedPass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        res.json({
            message: 'Pass updated successfully',
            pass: updatedPass
        });

    } catch (error) {
        console.error('Update pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Soft delete pass (Manager only)
exports.deletePass = async (req, res) => {
    try {
        const requestingManager = await Manager.findOne({ userId: req.user.userId });
        if (!requestingManager || !requestingManager.canManage()) {
            return res.status(403).json({ 
                message: 'Access denied. Manager permissions required.' 
            });
        }

        const { passId } = req.params;

        const pass = await Pass.findOneAndUpdate(
            { passId },
            { isActive: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        res.json({
            message: 'Pass deleted successfully',
            pass
        });

    } catch (error) {
        console.error('Delete pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User operations

// Purchase a pass
exports.purchasePass = async (req, res) => {
    try {
        const { passId } = req.params;
        const { paymentMethod = 'mock' } = req.body;

        // Get the pass
        const pass = await Pass.findOne({ passId, isActive: true });
        if (!pass) {
            return res.status(404).json({ message: 'Pass not found or not available' });
        }

        // Get user info
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate expiration date
        const startDate = new Date();
        const expirationDate = new Date(startDate);
        const daysToAdd = pass.getDurationInDays();
        expirationDate.setDate(expirationDate.getDate() + daysToAdd);

        // Generate next userPass ID
        const userPassId = await UserPass.getNextUserPassId();

        // Create user pass
        const userPass = new UserPass({
            userPassId,
            userId: req.user.userId,
            passId: pass.passId,
            startDate,
            expirationDate,
            sessionsRemaining: pass.sessions,
            totalSessions: pass.sessions,
            purchasePrice: pass.price,
            paymentMethod,
            paymentStatus: 'completed' // Mock payment always succeeds
        });

        await userPass.save();

        // Get the pass details for response
        const passDetails = await Pass.findOne({ passId: pass.passId });

        res.status(201).json({
            message: 'Pass purchased successfully',
            userPass: {
                ...userPass.toObject(),
                passId: passDetails
            },
            user: {
                name: `${user.firstname} ${user.lastname}`,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Purchase pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user's passes
exports.getUserPasses = async (req, res) => {
    try {
        const userPasses = await UserPass.find({ userId: req.user.userId })
            .sort({ purchaseDate: -1 });

        if (!userPasses || userPasses.length === 0) {
            return res.json({ message: 'No passes found', userPasses: [] });
        }

        // Manually populate pass details
        const populatedUserPasses = await Promise.all(
            userPasses.map(async (userPass) => {
                const pass = await Pass.findOne({ passId: userPass.passId });
                return {
                    ...userPass.toObject(),
                    passId: pass
                };
            })
        );

        res.json({ userPasses: populatedUserPasses });
    } catch (error) {
        console.error('Get user passes error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user's active passes
exports.getUserActivePasses = async (req, res) => {
    try {
        const now = new Date();
        const activePasses = await UserPass.find({ 
            userId: req.user.userId,
            isActive: true,
            expirationDate: { $gt: now },
            sessionsRemaining: { $gt: 0 }
        }).sort({ expirationDate: 1 });

        // Manually populate pass details
        const populatedActivePasses = await Promise.all(
            activePasses.map(async (userPass) => {
                const pass = await Pass.findOne({ passId: userPass.passId });
                return {
                    ...userPass.toObject(),
                    passId: pass
                };
            })
        );

        res.json(populatedActivePasses);
    } catch (error) {
        console.error('Get user active passes error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check if user has valid pass for booking
exports.checkValidPass = async (req, res) => {
    try {
        const hasValidPass = await UserPass.hasValidPass(req.user.userId);
        const activePasses = await UserPass.getUserActivePasses(req.user.userId);
        
        res.json({
            hasValidPass,
            activePasses
        });
    } catch (error) {
        console.error('Check valid pass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
