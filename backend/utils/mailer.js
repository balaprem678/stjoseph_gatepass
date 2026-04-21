const nodemailer = require('nodemailer');
const SMTPConfig = require('../models/SMTPConfig');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const getTransporter = async () => {
    const config = await SMTPConfig.findOne();
    if (!config || config.serviceType === 'brevo') {
        return null; // Brevo doesn't use nodemailer transporter
    }

    console.log(`Attempting SMTP connection to ${config.host}:${config.port} (User: ${config.user})`);

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        pool: true,
        auth: {
            user: config.user,
            pass: config.pass
        },
        tls: {
            rejectUnauthorized: false
        },
        requireTLS: config.port === 587,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
};

const sendEmail = async ({ to, subject, text }) => {
    try {
        const config = await SMTPConfig.findOne();
        if (!config) {
            console.log('No SMTP/Brevo Config found in DB');
            console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Text: ${text}`);
            return { mock: true };
        }

        if (config.serviceType === 'brevo' && config.apiKey) {
            console.log(`Attempting to send email via Brevo API`);
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = config.apiKey;

            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = `<html><body><p>${text.replace(/\n/g, '<br>')}</p></body></html>`;
            sendSmtpEmail.sender = { email: config.from, name: config.fromName || "St. Joseph Gate Pass" };
            sendSmtpEmail.to = [{ email: to }];

            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Brevo API called successfully. Returned data:', data);
            return data;
        } else {
            const transporter = await getTransporter();
            if (!transporter) {
                console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Text: ${text}`);
                return { mock: true };
            }

            const info = await transporter.sendMail({
                from: config.from,
                to: to,
                subject: subject,
                text: text
            });
            
            return info;
        }
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};

module.exports = { sendEmail, getTransporter };
