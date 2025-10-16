const mongoose = require("mongoose");

// Pass schema
const passSchema = new mongoose.Schema({
    passId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        value: {
            type: Number,
            required: true,
            min: 1
        },
        unit: {
            type: String,
            required: true,
            enum: ['days', 'weeks', 'months', 'years'],
            default: 'months'
        }
    },
    sessions: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String, // Manager userId who created this pass
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
passSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to get duration in days for calculations
passSchema.methods.getDurationInDays = function() {
    const { value, unit } = this.duration;
    switch (unit) {
        case 'days':
            return value;
        case 'weeks':
            return value * 7;
        case 'months':
            return value * 30; // Approximate
        case 'years':
            return value * 365; // Approximate
        default:
            return value * 30;
    }
};

// Method to format duration for display
passSchema.methods.getFormattedDuration = function() {
    const { value, unit } = this.duration;
    const unitName = value === 1 ? unit.slice(0, -1) : unit; // Remove 's' for singular
    return `${value} ${unitName}`;
};

// Static method to generate next pass ID
passSchema.statics.getNextPassId = async function() {
    const lastPass = await this.findOne({}, {}, { sort: { 'passId': -1 } });
    
    if (!lastPass) {
        return 'P00001';
    }
    
    const lastIdNumber = parseInt(lastPass.passId.substring(1));
    const nextIdNumber = lastIdNumber + 1;
    return 'P' + nextIdNumber.toString().padStart(5, '0');
};

// Static method to get active passes
passSchema.statics.getActivePasses = function() {
    return this.find({ isActive: true }).sort({ price: 1 });
};

module.exports = mongoose.model("Pass", passSchema);