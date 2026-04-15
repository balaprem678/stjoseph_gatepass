const nodemailer = require('nodemailer');
const SMTPConfig = require('../models/SMTPConfig');

const getTransporter = async () => {
    const config = await SMTPConfig.findOne();
    if (!config) {
        console.log('No SMTP Config found in DB');
        return null;
    }

    console.log(`Attempting SMTP connection to ${config.host}:${config.port} (User: ${config.user})`);

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        pool: true, // Enable connection pooling
        auth: {
            user: config.user,
            pass: config.pass
        },
        tls: {
            rejectUnauthorized: false
        },
        requireTLS: config.port === 587, // Enforce TLS for port 587
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 15000,
        socketTimeout: 30000,
        logger: true, // Output logs to console
        debug: true   // Include debug info in logs
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
