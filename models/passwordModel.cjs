const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("../config/mongodbconn.cjs");

const passwordSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true,
        ref: 'User'
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    lastChanged: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, {
    collection: "passwords",
    timestamps: true
});

// Static method to hash password
passwordSchema.statics.hashPassword = async function(plainPassword) {
    const saltRounds = 12;
    return await bcrypt.hash(plainPassword, saltRounds);
};

// Instance method to validate password
passwordSchema.methods.validatePassword = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.passwordHash);
};

// Static method to create or update password
passwordSchema.statics.setPassword = async function(userId, plainPassword) {
    const hashedPassword = await this.hashPassword(plainPassword);
    
    return await this.findOneAndUpdate(
        { userId },
        { 
            passwordHash: hashedPassword,
            lastChanged: new Date(),
            isActive: true
        },
        { 
            upsert: true, 
            new: true 
        }
    );
};

// Static method to deactivate password (for security)
passwordSchema.statics.deactivatePassword = async function(userId) {
    return await this.findOneAndUpdate(
        { userId },
        { isActive: false },
        { new: true }
    );
};

module.exports = mongoose.model("Password", passwordSchema);
