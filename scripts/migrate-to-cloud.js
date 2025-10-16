const mongoose = require('mongoose');

// Import your models
const User = require('../models/userModel.cjs');
const Password = require('../models/passwordModel.cjs');
const Manager = require('../models/managerModel.cjs');
const Instructor = require('../models/instructorModel.cjs');

// Database configurations
const LOCAL_URI = 'mongodb://localhost/yogidb';
const CLOUD_URI = 'mongodb+srv://david:567890@cluster0.rxyuatj.mongodb.net/yogidb';

async function migrateData() {
    let localConnection, cloudConnection;
    
    try {
        console.log('🔄 Starting data migration...');
        
        // Connect to local database
        console.log('📡 Connecting to local database...');
        localConnection = mongoose.createConnection(LOCAL_URI);
        await new Promise((resolve, reject) => {
            localConnection.once('open', resolve);
            localConnection.once('error', reject);
        });
        console.log('✅ Connected to local database');
        
        // Connect to cloud database
        console.log('☁️ Connecting to cloud database...');
        cloudConnection = mongoose.createConnection(CLOUD_URI);
        await new Promise((resolve, reject) => {
            cloudConnection.once('open', resolve);
            cloudConnection.once('error', reject);
        });
        console.log('✅ Connected to cloud database');
        
        // Create models for both connections
        const LocalUser = localConnection.model('User', User.schema);
        const LocalPassword = localConnection.model('Password', Password.schema);
        const LocalManager = localConnection.model('Manager', Manager.schema);
        const LocalInstructor = localConnection.model('Instructor', Instructor.schema);
        
        const CloudUser = cloudConnection.model('User', User.schema);
        const CloudPassword = cloudConnection.model('Password', Password.schema);
        const CloudManager = cloudConnection.model('Manager', Manager.schema);
        const CloudInstructor = cloudConnection.model('Instructor', Instructor.schema);
        
        // Migrate Users
        console.log('👥 Migrating Users...');
        const localUsers = await LocalUser.find({});
        console.log(`Found ${localUsers.length} users in local database`);
        
        for (const user of localUsers) {
            const existingUser = await CloudUser.findOne({ userId: user.userId });
            if (!existingUser) {
                const newUser = new CloudUser(user.toObject());
                await newUser.save();
                console.log(`✅ Migrated user: ${user.email} (${user.userId})`);
            } else {
                console.log(`⏭️ User already exists: ${user.email} (${user.userId})`);
            }
        }
        
        // Migrate Passwords
        console.log('🔐 Migrating Passwords...');
        const localPasswords = await LocalPassword.find({});
        console.log(`Found ${localPasswords.length} passwords in local database`);
        
        for (const password of localPasswords) {
            const existingPassword = await CloudPassword.findOne({ userId: password.userId });
            if (!existingPassword) {
                const newPassword = new CloudPassword(password.toObject());
                await newPassword.save();
                console.log(`✅ Migrated password for user: ${password.userId}`);
            } else {
                console.log(`⏭️ Password already exists for user: ${password.userId}`);
            }
        }
        
        // Migrate Managers
        console.log('👔 Migrating Managers...');
        const localManagers = await LocalManager.find({});
        console.log(`Found ${localManagers.length} managers in local database`);
        
        for (const manager of localManagers) {
            const existingManager = await CloudManager.findOne({ managerId: manager.managerId });
            if (!existingManager) {
                const newManager = new CloudManager(manager.toObject());
                await newManager.save();
                console.log(`✅ Migrated manager: ${manager.managerId}`);
            } else {
                console.log(`⏭️ Manager already exists: ${manager.managerId}`);
            }
        }
        
        // Migrate Instructors
        console.log('🧘‍♀️ Migrating Instructors...');
        const localInstructors = await LocalInstructor.find({});
        console.log(`Found ${localInstructors.length} instructors in local database`);
        
        for (const instructor of localInstructors) {
            const existingInstructor = await CloudInstructor.findOne({ instructorId: instructor.instructorId });
            if (!existingInstructor) {
                const newInstructor = new CloudInstructor(instructor.toObject());
                await newInstructor.save();
                console.log(`✅ Migrated instructor: ${instructor.instructorId}`);
            } else {
                console.log(`⏭️ Instructor already exists: ${instructor.instructorId}`);
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
        // Summary
        const cloudUsers = await CloudUser.countDocuments();
        const cloudPasswords = await CloudPassword.countDocuments();
        const cloudManagers = await CloudManager.countDocuments();
        const cloudInstructors = await CloudInstructor.countDocuments();
        
        console.log('\n📊 Migration Summary:');
        console.log(`Users in cloud database: ${cloudUsers}`);
        console.log(`Passwords in cloud database: ${cloudPasswords}`);
        console.log(`Managers in cloud database: ${cloudManagers}`);
        console.log(`Instructors in cloud database: ${cloudInstructors}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close connections
        if (localConnection) {
            await localConnection.close();
            console.log('📡 Local connection closed');
        }
        if (cloudConnection) {
            await cloudConnection.close();
            console.log('☁️ Cloud connection closed');
        }
        process.exit(0);
    }
}

// Run migration
migrateData();
