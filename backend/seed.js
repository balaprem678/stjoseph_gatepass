const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatepass');
        
        // Drop the collection to remove old unique indexes (like the one on 'id')
        try {
            await mongoose.connection.db.dropCollection('users');
            console.log('Dropped existing users collection');
        } catch (e) {
            console.log('Users collection not found, skipping drop');
        }
        
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists');
        } else {
            const admin = new User({
                loginId: 'admin',
                fullName: 'Super Admin',
                email: 'admin@college.edu',
                password: 'admin123', // Standard login for admin
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created: admin / admin123');
        }

        // Also create a sample security and hod for testing
        const sampleHOD = await User.findOne({ loginId: 'hod1' });
        if (!sampleHOD) {
            await new User({
                loginId: 'hod1',
                fullName: 'HOD Computer Science',
                email: 'hod@college.edu',
                password: 'password123',
                role: 'hod'
            }).save();
            console.log('Sample HOD created: hod1 / password123');
        }

        const samplePrincipal = await User.findOne({ loginId: 'principal1' });
        if (!samplePrincipal) {
            await new User({
                loginId: 'principal1',
                fullName: 'Principal',
                email: 'principal@college.edu',
                password: 'password123',
                role: 'principal'
            }).save();
            console.log('Sample Principal created: principal1 / password123');
        }

        const sampleSecurity = await User.findOne({ loginId: 'security1' });
        if (!sampleSecurity) {
            await new User({
                loginId: 'security1',
                fullName: 'Main Gate Security',
                email: 'security@college.edu',
                password: 'password123',
                role: 'security'
            }).save();
            console.log('Sample Security created: security1 / password123');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

seedAdmin();
