const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");


const classModel = new mongoose.Schema({
    classId: String,
    className: String,
    instructorId: String,
    classType: String, 
    description: String,
    daytime: [
        {
            day: String,
            time: String,
            duration: Number
        }
    ],
    registeredUsers: [
        {
            userId: {
                type: String,
                ref: 'User'
            },
            registrationDate: {
                type: Date,
                default: Date.now
            },
            userPassId: {
                type: String,
                ref: 'UserPass'
            }
        }
    ],
    attendanceRecords: [
        {
            date: {
                type: Date,
                required: true
            },
            attendees: [
                {
                    userId: {
                        type: String,
                        ref: 'User'
                    },
                    checkInTime: {
                        type: Date,
                        default: Date.now
                    },
                    userPassId: {
                        type: String,
                        ref: 'UserPass'
                    }
                }
            ]
        }
    ],
    capacity: {
        type: Number,
        default: 20
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    collection: "class",
    timestamps: true
});

// Instance methods
classModel.methods.addRegistration = function(userId, userPassId) {
    // Check if user is already registered
    const existingRegistration = this.registeredUsers.find(
        reg => reg.userId === userId
    );
    
    if (existingRegistration) {
        throw new Error('User is already registered for this class');
    }
    
    // Check capacity
    if (this.registeredUsers.length >= this.capacity) {
        throw new Error('Class is at full capacity');
    }
    
    this.registeredUsers.push({
        userId,
        userPassId,
        registrationDate: new Date()
    });
    
    return this.save();
};

classModel.methods.removeRegistration = function(userId) {
    this.registeredUsers = this.registeredUsers.filter(
        reg => reg.userId !== userId
    );
    return this.save();
};

classModel.methods.markAttendance = function(date, attendeesList) {
    // Find or create attendance record for the date
    let attendanceRecord = this.attendanceRecords.find(
        record => record.date.toDateString() === new Date(date).toDateString()
    );
    
    if (!attendanceRecord) {
        attendanceRecord = {
            date: new Date(date),
            attendees: []
        };
        this.attendanceRecords.push(attendanceRecord);
    } else {
        // Clear existing attendees for this date
        attendanceRecord.attendees = [];
    }
    
    // Add new attendees
    attendeesList.forEach(attendee => {
        attendanceRecord.attendees.push({
            userId: attendee.userId,
            userPassId: attendee.userPassId,
            checkInTime: new Date()
        });
    });
    
    return this.save();
};

classModel.methods.getAttendanceForDate = function(date) {
    return this.attendanceRecords.find(
        record => record.date.toDateString() === new Date(date).toDateString()
    );
};

classModel.methods.isUserRegistered = function(userId) {
    return this.registeredUsers.some(reg => reg.userId === userId);
};

module.exports = mongoose.model("Class", classModel);
