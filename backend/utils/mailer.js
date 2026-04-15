const nodemailer = require('nodemailer');
const SMTPConfig = require('../models/SMTPConfig');

const getTransporter = async () => {
    const config = await SMTPConfig.findOne();
    if (!config) {
        console.log('No SMTP Config found in DB');
        return null;
    }

    // console.log('Creating transporter with host:', config.host);

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
            user: config.user,
            pass: config.pass
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 30000
    });
};

const sendEmail = async ({ to, subject, text }) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Text: ${text}`);
            return { mock: true };
        }

        const config = await SMTPConfig.findOne();
        const info = await transporter.sendMail({
            from: config.from,
            to: to,
            subject: subject,
            text: text
        });
        
        return info;
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};

module.exports = { sendEmail, getTransporter };
