const SMSConfig = require('../models/SMSConfig');

const sendSMS = async ({ to, message }) => {
    try {
        const config = await SMSConfig.findOne();
        if (!config || !config.apiKey) {
            console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
            return { mock: true };
        }

        // Sanitize phone number (remove any non-digits, and take the last 10 digits for Indian numbers)
        const cleanNumber = String(to).replace(/\D/g, '');
        const finalNumber = cleanNumber.length >= 10 ? cleanNumber.slice(-10) : cleanNumber;

        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
                "authorization": config.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                route: "q",
                message: message,
                language: "english",
                flash: 0,
                numbers: finalNumber
            })
        });

        const data = await response.json();
        console.log('Fast2SMS response:', data);
        return data;
    } catch (error) {
        console.error('SMS send error:', error);
        throw error;
    }
};

module.exports = { sendSMS };
