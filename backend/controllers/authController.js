const User = require('../models/User');
const SMTPConfig = require('../models/SMTPConfig');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const { sendSMS } = require('../utils/sms');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
    try {
        const { loginId, fullName, email, phone, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ loginId }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already registered with this ID or Email' });
        }

        const user = new User({
            loginId,
            fullName,
            email,
            phone,
            role: role || 'student'
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { loginId, role } = req.body;

        // If role is staff, allow any staff-related role
        const roleQuery = role === 'staff'
            ? { $in: ['staff', 'hod', 'principal', 'security'] }
            : role;

        const user = await User.findOne({ loginId, role: roleQuery });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // HOD, Principal, and Security use passwords, not OTP
        if (['hod', 'principal', 'security'].includes(user.role)) {
            return res.status(400).json({ message: 'This account requires a password to login' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP via email and SMS
        const emailPromise = sendEmail({
            to: user.email,
            subject: 'Gate Pass - Your Login OTP',
            text: `Your OTP for Gate Pass login is ${otp}. It expires in 10 minutes.`
        });

        const smsPromise = sendSMS({
            to: user.phone,
            message: `Your OTP for Gate Pass login is ${otp}. It expires in 10 minutes.`
        });

        const [infoEmail] = await Promise.allSettled([emailPromise, smsPromise]);

        if (infoEmail.status === 'fulfilled' && infoEmail.value?.mock) {
            res.json({ message: 'OTP generated (Mock: check server logs)', otp });
        } else {
            res.json({ message: 'OTP sent to your email and phone' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { loginId, role, authValue } = req.body; // authValue is otp for student/staff, password for others

        // If role is staff, allow any staff-related role
        const roleQuery = role === 'staff'
            ? { $in: ['staff', 'hod', 'principal', 'security'] }
            : role;

        const user = await User.findOne({ loginId, role: roleQuery });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check auth type based on ACTUAL user role
        if (user.role === 'student' || user.role === 'staff') {
            if (user.otp !== authValue || user.otpExpires < Date.now()) {
                return res.status(401).json({ message: 'Invalid or expired OTP' });
            }
            // Clear OTP after login
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
        } else {
            // hod, principal, security, (admin)
            if (user.password !== authValue) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, loginId: user.loginId },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                loginId: user.loginId,
                fullName: user.fullName,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
