const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema({
    serviceType: { type: String, enum: ['smtp', 'brevo'], default: 'smtp' },
    // Standard SMTP fields
    host: { type: String },
    port: { type: Number },
    user: { type: String },
    pass: { type: String },
    // Brevo API fields
    apiKey: { type: String },
    // Common fields
    from: { type: String, required: true },
    fromName: { type: String, default: 'St. Joseph Gate Pass' }
}, { timestamps: true });

module.exports = mongoose.model('SMTPConfig', smtpConfigSchema);
