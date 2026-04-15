const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true }, // enrollmentNumber or staffID
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ['student', 'staff', 'hod', 'principal', 'security', 'admin'], default: 'student' },
    password: { type: String }, // For non-student/staff roles
    otp: { type: String },
    otpExpires: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
