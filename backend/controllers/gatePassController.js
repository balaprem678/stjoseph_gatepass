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
            userRole: req.user.role,
            userId: req.user.id, // From auth middleware
            hodApproval: {
                status: req.user.role === 'staff' ? 'not_required' : 'waiting',
                date: req.user.role === 'staff' ? new Date() : null
            }
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

        // Hide staff requests from HODs
        if (req.user.role === 'hod') {
            query.userRole = 'student';
        }

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
            if (decision === 'approved') {
                gatePass.status = 'hod_approved';
                
                // Notify user about HOD approval
                await sendEmail({
                    to: gatePass.email,
                    subject: 'Gate Pass Approved by HOD',
                    text: `Your gate pass application (ID: ${gatePass._id}) has been approved by the HOD and is now pending Principal's approval.`
                });
            }
        } else if (role === 'principal') {
            gatePass.principalApproval = { status: decision, date: new Date() };

            if (decision === 'approved') {
                gatePass.status = 'principal_approved';

                // Notify user about final approval
                await sendEmail({
                    to: gatePass.email,
                    subject: 'Gate Pass Final Approval',
                    text: `Your gate pass application (ID: ${gatePass._id}) has received final approval from the Principal. You can now use it at the gate.`
                });
            }
        }

        // Handle Rejection
        if (decision === 'rejected') {
            gatePass.status = 'rejected';
            if (rejectionReason) gatePass.rejectionReason = rejectionReason;
            
            // Notify user about rejection via Email & SMS
            const emailPromise = sendEmail({
                to: gatePass.email,
                subject: 'Gate Pass Rejected',
                text: `Your gate pass application (ID: ${gatePass._id}) has been rejected by ${role.toUpperCase()}. \n\nReason: ${rejectionReason || 'No reason provided.'}`
            });

            const smsPromise = sendSMS({
                to: gatePass.phone,
                message: `Your gate pass application (ID: ${gatePass._id}) has been rejected by ${role.toUpperCase()}. Reason: ${rejectionReason || 'No reason provided.'}`
            });

            await Promise.allSettled([emailPromise, smsPromise]);
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

exports.sendRejectionSMS = async (req, res) => {
    try {
        const { id } = req.params;
        const gatePass = await GatePass.findById(id);
        
        if (!gatePass) return res.status(404).json({ message: 'Gate pass not found' });
        if (gatePass.status !== 'rejected') {
            return res.status(400).json({ message: 'Gate pass is not rejected' });
        }

        // Send SMS reminder with rejection reason
        const smsPromise = sendSMS({
            to: gatePass.phone,
            message: `Reminder: Your gate pass (ID: ${gatePass._id}) has been rejected.\n\nReason: ${gatePass.rejectionReason || 'No reason provided.'}`
        });

        await smsPromise;

        res.json({ message: 'Rejection reminder SMS sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
