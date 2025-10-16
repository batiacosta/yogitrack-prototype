const mongoose = require("mongoose");

// UserPass schema - tracks user pass purchases
const userPassSchema = new mongoose.Schema({
    userPassId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    passId: {
        type: String,
        required: true,
        ref: 'Pass'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expirationDate: {
        type: Date,
        required: true
    },
    sessionsRemaining: {
        type: Number,
        required: true,
        min: 0
    },
    totalSessions: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'cash', 'mock'],
        default: 'mock'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
    }
});

// Index for efficient queries
userPassSchema.index({ userId: 1, isActive: 1 });
userPassSchema.index({ expirationDate: 1 });

// Method to check if pass is valid
userPassSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           this.expirationDate > now && 
           this.sessionsRemaining > 0;
};

// Method to use a session
userPassSchema.methods.useSession = function() {
    if (this.sessionsRemaining > 0) {
        this.sessionsRemaining -= 1;
        if (this.sessionsRemaining === 0) {
            this.isActive = false;
        }
        return this.save();
    }
    throw new Error('No sessions remaining');
};

// Method to get days remaining
userPassSchema.methods.getDaysRemaining = function() {
    const now = new Date();
    const diffTime = this.expirationDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
};

// Static method to generate next userPass ID
userPassSchema.statics.getNextUserPassId = async function() {
    const lastUserPass = await this.findOne({}, {}, { sort: { 'userPassId': -1 } });
    
    if (!lastUserPass) {
        return 'UP00001';
    }
    
    const lastIdNumber = parseInt(lastUserPass.userPassId.substring(2));
    const nextIdNumber = lastIdNumber + 1;
    return 'UP' + nextIdNumber.toString().padStart(5, '0');
};

// Static method to get user's active passes
userPassSchema.statics.getUserActivePasses = function(userId) {
    const now = new Date();
    return this.find({ 
        userId: userId,
        isActive: true,
        expirationDate: { $gt: now },
        sessionsRemaining: { $gt: 0 }
    }).populate('passId').sort({ expirationDate: 1 });
};

// Static method to check if user has valid pass
userPassSchema.statics.hasValidPass = async function(userId) {
    const activePasses = await this.getUserActivePasses(userId);
    return activePasses.length > 0;
};

module.exports = mongoose.model("UserPass", userPassSchema);