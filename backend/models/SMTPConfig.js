const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema({
    host: { type: String, required: true },
    port: { type: Number, required: true },
    user: { type: String, required: true },
    pass: { type: String, required: true },
    from: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SMTPConfig', smtpConfigSchema);
