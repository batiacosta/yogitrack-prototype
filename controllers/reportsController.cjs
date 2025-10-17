const User = require("../models/userModel.cjs");
const Manager = require("../models/managerModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const Class = require("../models/classModel.cjs");
const UserPass = require("../models/userPassModel.cjs");
const fs = require('fs');
const path = require('path');

// Performance Report - Package sales and new users by month/year
exports.getPerformanceReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Validate manager permissions
        const manager = await Manager.findOne({ userId: req.user.userId });
        if (!manager) {
            return res.status(403).json({ message: 'Access denied. Manager permissions required.' });
        }

        // Build date filter
        let startDate, endDate;
        if (year && month) {
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        } else {
            // Default to current year
            const currentYear = new Date().getFullYear();
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        // Get new users count
        const newUsers = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            userType: 'User' // Exclude instructors and managers
        });

        // Get new instructors count
        const newInstructors = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            userType: 'Instructor'
        });

        // Get package sales from UserPass (active passes purchased in period)
        const packageSales = await UserPass.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$amountPaid" },
                    averagePrice: { $avg: "$amountPaid" }
                }
            }
        ]);

        // Get monthly breakdown if year-only query
        let monthlyBreakdown = [];
        if (year && !month) {
            for (let i = 0; i < 12; i++) {
                const monthStart = new Date(parseInt(year), i, 1);
                const monthEnd = new Date(parseInt(year), i + 1, 0, 23, 59, 59);
                
                const monthUsers = await User.countDocuments({
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    userType: 'User'
                });

                const monthSales = await UserPass.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: monthStart, $lte: monthEnd }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            revenue: { $sum: "$amountPaid" }
                        }
                    }
                ]);

                monthlyBreakdown.push({
                    month: i + 1,
                    monthName: monthStart.toLocaleString('default', { month: 'long' }),
                    newUsers: monthUsers,
                    packageSales: monthSales[0]?.count || 0,
                    revenue: monthSales[0]?.revenue || 0
                });
            }
        }

        const report = {
            period: {
                year: parseInt(year) || new Date().getFullYear(),
                month: month ? parseInt(month) : null,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary: {
                newUsers,
                newInstructors,
                packageSales: packageSales[0]?.totalSales || 0,
                totalRevenue: packageSales[0]?.totalRevenue || 0,
                averagePackagePrice: packageSales[0]?.averagePrice || 0
            },
            monthlyBreakdown: monthlyBreakdown.length > 0 ? monthlyBreakdown : null
        };

        res.json(report);

    } catch (err) {
        console.error('Error generating performance report:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Instructor Performance Report - Students scheduling and attendance per instructor
exports.getInstructorPerformanceReport = async (req, res) => {
    try {
        const { year, month, instructorId } = req.query;
        
        // Validate manager permissions
        const manager = await Manager.findOne({ userId: req.user.userId });
        if (!manager) {
            return res.status(403).json({ message: 'Access denied. Manager permissions required.' });
        }

        // Build date filter
        let startDate, endDate;
        if (year && month) {
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        } else {
            const currentYear = new Date().getFullYear();
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        // Build instructor filter
        let instructorFilter = {};
        if (instructorId) {
            instructorFilter.instructorId = instructorId;
        }

        // Get all instructors for reference
        const instructors = await Instructor.find(instructorFilter);
        const instructorData = [];

        for (const instructor of instructors) {
            // Get instructor's classes
            const classes = await Class.find({ 
                instructorId: instructor.instructorId,
                isActive: true 
            });

            let totalRegistrations = 0;
            let totalAttendance = 0;
            let uniqueStudents = new Set();
            let classDetails = [];

            for (const classDoc of classes) {
                // Count registrations in period
                const periodRegistrations = classDoc.registeredUsers.filter(reg => {
                    const regDate = new Date(reg.registrationDate);
                    return regDate >= startDate && regDate <= endDate;
                });

                // Count attendance in period
                const periodAttendance = classDoc.attendanceRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= startDate && recordDate <= endDate;
                }).reduce((total, record) => total + record.attendees.length, 0);

                // Track unique students
                periodRegistrations.forEach(reg => uniqueStudents.add(reg.userId));

                totalRegistrations += periodRegistrations.length;
                totalAttendance += periodAttendance;

                if (periodRegistrations.length > 0 || periodAttendance > 0) {
                    classDetails.push({
                        classId: classDoc.classId,
                        className: classDoc.className,
                        classType: classDoc.classType,
                        registrations: periodRegistrations.length,
                        attendance: periodAttendance,
                        attendanceRate: periodRegistrations.length > 0 ? 
                            ((periodAttendance / periodRegistrations.length) * 100).toFixed(1) : '0.0'
                    });
                }
            }

            // Get instructor user details
            const instructorUser = await User.findOne({ userId: instructor.userId });

            instructorData.push({
                instructorId: instructor.instructorId,
                name: instructorUser ? `${instructorUser.firstname} ${instructorUser.lastname}` : 'Unknown',
                email: instructorUser?.email || 'Unknown',
                totalClasses: classes.length,
                totalRegistrations,
                totalAttendance,
                uniqueStudents: uniqueStudents.size,
                attendanceRate: totalRegistrations > 0 ? 
                    ((totalAttendance / totalRegistrations) * 100).toFixed(1) : '0.0',
                classDetails
            });
        }

        // Sort by total registrations descending
        instructorData.sort((a, b) => b.totalRegistrations - a.totalRegistrations);

        const report = {
            period: {
                year: parseInt(year) || new Date().getFullYear(),
                month: month ? parseInt(month) : null,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary: {
                totalInstructors: instructorData.length,
                totalRegistrations: instructorData.reduce((sum, i) => sum + i.totalRegistrations, 0),
                totalAttendance: instructorData.reduce((sum, i) => sum + i.totalAttendance, 0),
                averageAttendanceRate: instructorData.length > 0 ? 
                    (instructorData.reduce((sum, i) => sum + parseFloat(i.attendanceRate), 0) / instructorData.length).toFixed(1) : '0.0'
            },
            instructors: instructorData
        };

        res.json(report);

    } catch (err) {
        console.error('Error generating instructor performance report:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Customer Attendance Report - Attendance vs scheduled classes per customer
exports.getCustomerAttendanceReport = async (req, res) => {
    try {
        const { year, month, userId } = req.query;
        
        // Validate manager permissions
        const manager = await Manager.findOne({ userId: req.user.userId });
        if (!manager) {
            return res.status(403).json({ message: 'Access denied. Manager permissions required.' });
        }

        // Build date filter
        let startDate, endDate;
        if (year && month) {
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        } else {
            const currentYear = new Date().getFullYear();
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        // Build user filter
        let userFilter = { userType: 'User' };
        if (userId) {
            userFilter.userId = userId;
        }

        // Get all users (customers)
        const users = await User.find(userFilter);
        const customerData = [];

        for (const user of users) {
            // Find all classes where user is registered
            const classes = await Class.find({
                'registeredUsers.userId': user.userId
            });

            let totalScheduled = 0;
            let totalAttended = 0;
            let classDetails = [];

            for (const classDoc of classes) {
                // Get user's registrations in period
                const userRegistrations = classDoc.registeredUsers.filter(reg => {
                    const regDate = new Date(reg.registrationDate);
                    return reg.userId === user.userId && regDate >= startDate && regDate <= endDate;
                });

                // Count attendance in period
                const userAttendance = classDoc.attendanceRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= startDate && recordDate <= endDate &&
                           record.attendees.some(attendee => attendee.userId === user.userId);
                }).length;

                if (userRegistrations.length > 0) {
                    totalScheduled += userRegistrations.length;
                    totalAttended += userAttendance;

                    classDetails.push({
                        classId: classDoc.classId,
                        className: classDoc.className,
                        classType: classDoc.classType,
                        instructorId: classDoc.instructorId,
                        scheduled: userRegistrations.length,
                        attended: userAttendance,
                        attendanceRate: userRegistrations.length > 0 ? 
                            ((userAttendance / userRegistrations.length) * 100).toFixed(1) : '0.0'
                    });
                }
            }

            if (totalScheduled > 0) {
                customerData.push({
                    userId: user.userId,
                    name: `${user.firstname} ${user.lastname}`,
                    email: user.email,
                    phone: user.phone,
                    totalScheduled,
                    totalAttended,
                    attendanceRate: ((totalAttended / totalScheduled) * 100).toFixed(1),
                    classDetails
                });
            }
        }

        // Sort by attendance rate descending
        customerData.sort((a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate));

        const report = {
            period: {
                year: parseInt(year) || new Date().getFullYear(),
                month: month ? parseInt(month) : null,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary: {
                totalCustomers: customerData.length,
                totalScheduled: customerData.reduce((sum, c) => sum + c.totalScheduled, 0),
                totalAttended: customerData.reduce((sum, c) => sum + c.totalAttended, 0),
                averageAttendanceRate: customerData.length > 0 ? 
                    (customerData.reduce((sum, c) => sum + parseFloat(c.attendanceRate), 0) / customerData.length).toFixed(1) : '0.0'
            },
            customers: customerData
        };

        res.json(report);

    } catch (err) {
        console.error('Error generating customer attendance report:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// General Attendance Report - Class popularity and attendance analysis
exports.getGeneralAttendanceReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Validate manager permissions
        const manager = await Manager.findOne({ userId: req.user.userId });
        if (!manager) {
            return res.status(403).json({ message: 'Access denied. Manager permissions required.' });
        }

        // Build date filter
        let startDate, endDate;
        if (year && month) {
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        } else {
            const currentYear = new Date().getFullYear();
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
        }

        // Get all active classes
        const classes = await Class.find({ isActive: true });
        const classData = [];

        for (const classDoc of classes) {
            // Count registrations in period
            const periodRegistrations = classDoc.registeredUsers.filter(reg => {
                const regDate = new Date(reg.registrationDate);
                return regDate >= startDate && regDate <= endDate;
            });

            // Count attendance in period
            const periodAttendanceRecords = classDoc.attendanceRecords.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= startDate && recordDate <= endDate;
            });

            const totalAttendance = periodAttendanceRecords.reduce(
                (total, record) => total + record.attendees.length, 0
            );

            // Get instructor details
            const instructor = await Instructor.findOne({ instructorId: classDoc.instructorId });
            const instructorUser = instructor ? await User.findOne({ userId: instructor.userId }) : null;

            if (periodRegistrations.length > 0 || totalAttendance > 0) {
                classData.push({
                    classId: classDoc.classId,
                    className: classDoc.className,
                    classType: classDoc.classType,
                    instructorId: classDoc.instructorId,
                    instructorName: instructorUser ? 
                        `${instructorUser.firstname} ${instructorUser.lastname}` : 'Unknown',
                    capacity: classDoc.capacity,
                    totalRegistrations: periodRegistrations.length,
                    totalAttendance,
                    attendanceRate: periodRegistrations.length > 0 ? 
                        ((totalAttendance / periodRegistrations.length) * 100).toFixed(1) : '0.0',
                    capacityUtilization: ((periodRegistrations.length / classDoc.capacity) * 100).toFixed(1),
                    sessionCount: periodAttendanceRecords.length,
                    averageAttendancePerSession: periodAttendanceRecords.length > 0 ? 
                        (totalAttendance / periodAttendanceRecords.length).toFixed(1) : '0.0'
                });
            }
        }

        // Sort by total registrations descending (popularity)
        classData.sort((a, b) => b.totalRegistrations - a.totalRegistrations);

        // Calculate class type statistics
        const classTypeStats = {};
        classData.forEach(cls => {
            if (!classTypeStats[cls.classType]) {
                classTypeStats[cls.classType] = {
                    classes: 0,
                    totalRegistrations: 0,
                    totalAttendance: 0,
                    averageAttendanceRate: 0
                };
            }
            classTypeStats[cls.classType].classes++;
            classTypeStats[cls.classType].totalRegistrations += cls.totalRegistrations;
            classTypeStats[cls.classType].totalAttendance += cls.totalAttendance;
        });

        // Calculate average attendance rates for class types
        Object.keys(classTypeStats).forEach(type => {
            const typeData = classTypeStats[type];
            typeData.averageAttendanceRate = typeData.totalRegistrations > 0 ? 
                ((typeData.totalAttendance / typeData.totalRegistrations) * 100).toFixed(1) : '0.0';
        });

        const report = {
            period: {
                year: parseInt(year) || new Date().getFullYear(),
                month: month ? parseInt(month) : null,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary: {
                totalClasses: classData.length,
                totalRegistrations: classData.reduce((sum, c) => sum + c.totalRegistrations, 0),
                totalAttendance: classData.reduce((sum, c) => sum + c.totalAttendance, 0),
                averageAttendanceRate: classData.length > 0 ? 
                    (classData.reduce((sum, c) => sum + parseFloat(c.attendanceRate), 0) / classData.length).toFixed(1) : '0.0',
                averageCapacityUtilization: classData.length > 0 ? 
                    (classData.reduce((sum, c) => sum + parseFloat(c.capacityUtilization), 0) / classData.length).toFixed(1) : '0.0'
            },
            classTypeStats,
            classes: classData
        };

        res.json(report);

    } catch (err) {
        console.error('Error generating general attendance report:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
