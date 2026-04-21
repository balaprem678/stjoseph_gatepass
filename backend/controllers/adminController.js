const User = require('../models/User');
const GatePass = require('../models/GatePass');
const SMTPConfig = require('../models/SMTPConfig');
const SMSConfig = require('../models/SMSConfig');

exports.createProfile = async (req, res) => {
    try {
        const { loginId, fullName, email, password, role } = req.body;
        
        if (!['hod', 'principal', 'security'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role for admin creation' });
        }

        const user = new User({ loginId, fullName, email, password, role });
        await user.save();
        
        res.status(201).json({ message: `${role} profile created successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { mongoId } = req.params;
        const user = await User.findByIdAndUpdate(mongoId, req.body, { new: true });
        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) query.role = role;
        
        const users = await User.find(query).select('-password -otp');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSMTP = async (req, res) => {
    try {
        let config = await SMTPConfig.findOne();
        if (config) {
            Object.assign(config, req.body);
            await config.save();
        } else {
            config = new SMTPConfig(req.body);
            await config.save();
        }
        res.json({ message: 'SMTP configuration updated', config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSMTPConfig = async (req, res) => {
    try {
        const config = await SMTPConfig.findOne();
        res.json({ config: config || { serviceType: 'smtp', host: '', port: 587, user: '', pass: '', apiKey: '', from: '', fromName: 'St. Joseph Gate Pass' } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSMSConfig = async (req, res) => {
    try {
        const config = await SMSConfig.findOne();
        res.json({ config: config || { apiKey: '' } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSMS = async (req, res) => {
    try {
        let config = await SMSConfig.findOne();
        if (config) {
            config.apiKey = req.body.apiKey;
            await config.save();
        } else {
            config = new SMSConfig({ apiKey: req.body.apiKey });
            await config.save();
        }
        res.json({ message: 'SMS configuration updated', config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalPasses = await GatePass.countDocuments();
        const usedPasses = await GatePass.countDocuments({ status: 'used' });
        const pendingPasses = await GatePass.countDocuments({ status: 'pending' });
        const rejectedPasses = await GatePass.countDocuments({ status: 'rejected' });

        res.json({
            totalPasses,
            usedPasses,
            pendingPasses,
            rejectedPasses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
