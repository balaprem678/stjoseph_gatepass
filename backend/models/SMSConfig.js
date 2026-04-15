const mongoose = require('mongoose');

const smsConfigSchema = new mongoose.Schema({
    apiKey: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SMSConfig', smsConfigSchema);
