const mongoose = require('mongoose');

// Import your models
const User = require('../models/userModel.cjs');
const Manager = require('../models/managerModel.cjs');
const Instructor = require('../models/instructorModel.cjs');

// Cloud database configuration
const CLOUD_URI = 'mongodb+srv://david:567890@cluster0.rxyuatj.mongodb.net/yogidb';

async function createMissingRecords() {
    let connection;
    
    try {
        console.log('🔄 Creating missing Manager and Instructor records...');
        
        // Connect to cloud database
        console.log('☁️ Connecting to cloud database...');
        connection = mongoose.createConnection(CLOUD_URI);
        await new Promise((resolve, reject) => {
            connection.once('open', resolve);
            connection.once('error', reject);
        });
        console.log('✅ Connected to cloud database');
        
        // Create models
        const CloudUser = connection.model('User', User.schema);
        const CloudManager = connection.model('Manager', Manager.schema);
        const CloudInstructor = connection.model('Instructor', Instructor.schema);
        
        // Find users that should have Manager records
        const managerUsers = await CloudUser.find({ userType: 'Manager' });
        console.log(`Found ${managerUsers.length} users with Manager type`);
        
        for (const user of managerUsers) {
            const existingManager = await CloudManager.findOne({ userId: user.userId });
            if (!existingManager) {
                // Extract manager ID from userId (e.g., M00001)
                const managerId = user.userId;
                
                const newManager = new CloudManager({
                    managerId: managerId,
                    userId: user.userId,
                    department: 'General Management',
                    isActive: true
                });
                
                await newManager.save();
                console.log(`✅ Created Manager record for: ${user.email} (${managerId})`);
            } else {
                console.log(`⏭️ Manager record already exists for: ${user.email}`);
            }
        }
        
        // Find users that should have Instructor records
        const instructorUsers = await CloudUser.find({ userType: 'Instructor' });
        console.log(`Found ${instructorUsers.length} users with Instructor type`);
        
        for (const user of instructorUsers) {
            const existingInstructor = await CloudInstructor.findOne({ userId: user.userId });
            if (!existingInstructor) {
                // Extract instructor ID from userId (e.g., I00001)
                const instructorId = user.userId;
                
                const newInstructor = new CloudInstructor({
                    instructorId: instructorId,
                    userId: user.userId,
                    specializations: ['Hatha Yoga', 'Vinyasa'],
                    classIds: [],
                    hireDate: new Date()
                });
                
                await newInstructor.save();
                console.log(`✅ Created Instructor record for: ${user.email} (${instructorId})`);
            } else {
                console.log(`⏭️ Instructor record already exists for: ${user.email}`);
            }
        }
        
        console.log('🎉 Missing records creation completed!');
        
        // Summary
        const totalManagers = await CloudManager.countDocuments();
        const totalInstructors = await CloudInstructor.countDocuments();
        const totalUsers = await CloudUser.countDocuments();
        
        console.log('\n📊 Final Summary:');
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Total Managers: ${totalManagers}`);
        console.log(`Total Instructors: ${totalInstructors}`);
        
    } catch (error) {
        console.error('❌ Operation failed:', error);
    } finally {
        if (connection) {
            await connection.close();
            console.log('☁️ Cloud connection closed');
        }
        process.exit(0);
    }
}

// Run the script
createMissingRecords();
