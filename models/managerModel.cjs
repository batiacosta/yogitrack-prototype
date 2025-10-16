const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const managerSchema = new mongoose.Schema({
    managerId: { 
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
    department: { 
        type: String, 
        default: 'Operations' 
    },
    hireDate: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, {
    collection: "managers",
    timestamps: true
});

// Instance methods
managerSchema.methods.canManage = function() {
    // All active managers have full control
    return this.isActive;
};

// Get user details (populate)
managerSchema.methods.getUserDetails = function() {
    return this.populate('userId');
};

// Static method for ID generation
managerSchema.statics.generateManagerId = async function() {
    const lastManager = await this.findOne(
        { managerId: /^M/ }, 
        {}, 
        { sort: { managerId: -1 } }
    );
    
    let maxNumber = 1;
    if (lastManager) {
        const match = lastManager.managerId.match(/^M(\d+)$/);
        if (match) {
            maxNumber = parseInt(match[1]) + 1;
        }
    }
    return `M${String(maxNumber).padStart(5, '0')}`;
};

module.exports = mongoose.model("Manager", managerSchema);
