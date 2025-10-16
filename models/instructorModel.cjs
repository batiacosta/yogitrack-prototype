const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const instructorSchema = new mongoose.Schema({
    instructorId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: { 
        type: String, 
        required: true, 
        unique: true,
        ref: 'User'
    },
    classIds: [{ 
        type: String 
    }],
    specializations: [String],
    hireDate: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, {
    collection: "instructors",
    timestamps: true
});

// Instance methods
instructorSchema.methods.addClassId = function(classId) {
    if (!this.classIds.includes(classId)) {
        this.classIds.push(classId);
    }
    return this.save();
};

instructorSchema.methods.removeClassId = function(classId) {
    this.classIds = this.classIds.filter(id => id !== classId);
    return this.save();
};

instructorSchema.methods.canTeachClass = function(classType) {
    return this.isActive && (
        this.specializations.includes(classType) || 
        this.specializations.includes('General')
    );
};

// Get user details (populate)
instructorSchema.methods.getUserDetails = function() {
    return this.populate('userId');
};

// Static method for ID generation
instructorSchema.statics.generateInstructorId = async function() {
    const lastInstructor = await this.findOne(
        { instructorId: /^I/ }, 
        {}, 
        { sort: { instructorId: -1 } }
    );
    
    let maxNumber = 1;
    if (lastInstructor) {
        const match = lastInstructor.instructorId.match(/^I(\d+)$/);
        if (match) {
            maxNumber = parseInt(match[1]) + 1;
        }
    }
    return `I${String(maxNumber).padStart(5, '0')}`;
};

module.exports = mongoose.model("Instructor", instructorSchema);
