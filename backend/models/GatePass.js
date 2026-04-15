const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
    photo: { type: String }, // Base64
    fullName: { type: String, required: true },
    enrollNo: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    outTime: { type: String, required: true },
    inTime: { type: String, required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'hod_approved', 'principal_approved', 'rejected', 'used'], default: 'pending' },
    hodApproval: {
        status: { type: String, enum: ['waiting', 'approved', 'rejected'], default: 'waiting' },
        date: { type: Date }
    },
    principalApproval: {
        status: { type: String, enum: ['waiting', 'approved', 'rejected'], default: 'waiting' },
        date: { type: Date }
    },
    usedAt: { type: Date },
    rejectionReason: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('GatePass', gatePassSchema);
