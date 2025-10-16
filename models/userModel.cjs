const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    preferredContact: { type: String, enum: ['phone', 'email'], default: 'email' },
    userType: { type: String, enum: ['User', 'Instructor', 'Manager'], required: true }
}, {
    collection: "users",
    timestamps: true
});

// Instance methods
userSchema.methods.getFullName = function() {
    return `${this.firstname} ${this.lastname}`;
};

userSchema.methods.sendWelcomeMessage = function() {
    const message = `Welcome to Yoga'Hom! Your ${this.userType.toLowerCase()} ID is ${this.userId}.`;
    console.log(`Sending ${this.preferredContact} to ${this.userType}: ${message}`);
    return message;
};

// Static methods for ID generation
userSchema.statics.generateUserId = async function(userType) {
    let prefix;
    switch(userType) {
        case 'User':
            prefix = 'U';
            break;
        case 'Instructor':
            prefix = 'I';
            break;
        case 'Manager':
            prefix = 'M';
            break;
        default:
            throw new Error('Invalid user type');
    }
    
    const lastUser = await this.findOne(
        { userId: { $regex: `^${prefix}` } }, 
        {}, 
        { sort: { userId: -1 } }
    );
    
    let maxNumber = 1;
    if (lastUser) {
        const match = lastUser.userId.match(new RegExp(`^${prefix}(\\d+)$`));
        if (match) {
            maxNumber = parseInt(match[1], 10) + 1;
        }
    }
    return `${prefix}${String(maxNumber).padStart(5, '0')}`;
};

module.exports = mongoose.model("User", userSchema);
