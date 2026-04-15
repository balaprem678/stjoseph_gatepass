const GatePass = require('../models/GatePass');
const User = require('../models/User');

exports.apply = async (req, res) => {
    try {
        const { photo, fullName, enrollNo, phone, email, outTime, inTime, date, reason } = req.body;
        
        const gatePass = new GatePass({
            photo,
            fullName,
            enrollNo,
            phone,
            email,
            outTime,
            inTime,
            date,
            reason,
            userId: req.user.id // From auth middleware
        });

        await gatePass.save();
        res.status(201).json({ message: 'Gate pass application submitted', gatePass });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listAll = async (req, res) => {
    try {
        const { status, date, enrollNo } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (date) query.date = date;
        if (enrollNo) query.enrollNo = { $regex: enrollNo, $options: 'i' };

        const passes = await GatePass.find(query).sort({ createdAt: -1 });
        res.json(passes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listMyRequests = async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = { userId: req.user.id };
        
        if (status) query.status = status;
        if (date) query.date = date;

        const passes = await GatePass.find(query).sort({ createdAt: -1 });
        res.json(passes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { sendEmail } = require('../utils/mailer');
const { sendSMS } = require('../utils/sms');

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, rejectionReason } = req.body; // 'approved' or 'rejected'
        const role = req.user.role;

        const gatePass = await GatePass.findById(id);
        if (!gatePass) return res.status(404).json({ message: 'Gate pass not found' });

        if (role === 'hod') {
            gatePass.hodApproval = { status: decision, date: new Date() };
        } else if (role === 'principal') {
            gatePass.principalApproval = { status: decision, date: new Date() };
        }

        // Update overall status
        if (gatePass.hodApproval.status === 'approved' && gatePass.principalApproval.status === 'approved') {
            gatePass.status = 'principal_approved';
        } else if (gatePass.hodApproval.status === 'rejected' || gatePass.principalApproval.status === 'rejected') {
            gatePass.status = 'rejected';
            if (rejectionReason) gatePass.rejectionReason = rejectionReason;
            
            // Notify user about rejection via Email & SMS
            const emailPromise = sendEmail({
                to: gatePass.email,
                subject: 'Gate Pass Rejected',
                text: `Your gate pass application (ID: ${gatePass._id}) has been rejected. \n\nReason: ${rejectionReason || 'No reason provided.'}`
            });

            const smsPromise = sendSMS({
                to: gatePass.phone,
                message: `Your gate pass application (ID: ${gatePass._id}) has been rejected. Reason: ${rejectionReason || 'No reason provided.'}`
            });

            await Promise.allSettled([emailPromise, smsPromise]);
        } else if (gatePass.hodApproval.status === 'approved') {
            gatePass.status = 'hod_approved';
        }

        await gatePass.save();
        res.json({ message: `Gate pass ${decision} by ${role}`, gatePass });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsUsed = async (req, res) => {
    try {
        const { id } = req.params;
        const gatePass = await GatePass.findById(id);
        
        if (!gatePass) return res.status(404).json({ message: 'Gate pass not found' });
        if (gatePass.status !== 'principal_approved') {
            return res.status(400).json({ message: 'Gate pass must be approved by Principal before use' });
        }

        gatePass.status = 'used';
        gatePass.usedAt = new Date();
        await gatePass.save();

        res.json({ message: 'Gate pass marked as used', gatePass });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const gatePass = await GatePass.findOne({ _id: id, userId: req.user.id });
        
        if (!gatePass) return res.status(404).json({ message: 'Gate pass not found or not authorized' });
        if (gatePass.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot edit an already processed gate pass' });
        }

        Object.assign(gatePass, req.body);
        await gatePass.save();

        res.json({ message: 'Gate pass updated', gatePass });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const gatePass = await GatePass.findOneAndDelete({ _id: id, userId: req.user.id, status: 'pending' });
        
        if (!gatePass) return res.status(404).json({ message: 'Gate pass not found or cannot be deleted' });

        res.json({ message: 'Gate pass deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
