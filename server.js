require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================================
// EMAIL CONFIGURATION
// =========================================================================
// 1. SENDER_EMAIL: The system account that sends the email (uses its 16-char App Password)
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;

// 2. SUPPORT_INBOX: Where incoming queries are delivered
const SUPPORT_INBOX = process.env.SUPPORT_INBOX;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (index.html, about.html, assets, page, etc.)
app.use(express.static(path.join(__dirname)));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    }
});

// =========================================================================
// CONTACT QUERY API ENDPOINT
// =========================================================================
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, email, subject, message) are required.'
        });
    }

    // 1. Email to the Achuppori Support Team
    const teamMailOptions = {
        from: `"Achuppori Support System" <${SENDER_EMAIL}>`,
        to: SUPPORT_INBOX,
        replyTo: `"${name}" <${email}>`,
        subject: `[Achuppori Support Query] ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0dcd3; background-color: #ffffff;">
                <div style="background-color: #ff4d00; color: #ffffff; padding: 12px 18px; font-weight: bold; font-size: 16px;">
                    Achuppori — New Support Query
                </div>
                <div style="padding: 20px 10px;">
                    <p style="margin: 6px 0;"><strong>Visitor Name:</strong> ${name}</p>
                    <p style="margin: 6px 0;"><strong>Visitor Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p style="margin: 6px 0;"><strong>Subject / Topic:</strong> ${subject}</p>
                    <hr style="border: 0; border-top: 1px dashed #e0dcd3; margin: 16px 0;" />
                    <p style="font-weight: bold; margin-bottom: 8px;">Query / Details:</p>
                    <div style="background: #f5f2eb; padding: 14px; border-left: 4px solid #ff4d00; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</div>
                    <hr style="border: 0; border-top: 1px dashed #e0dcd3; margin: 16px 0;" />
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        <em>💡 To reply to ${name}, click <strong>"Reply"</strong> in your inbox. It will automatically reply to <strong>${email}</strong>.</em>
                    </p>
                </div>
            </div>
        `,
        text: `From: ${name} (${email})\nSubject: ${subject}\n\nQuery:\n${message}\n\n---\nHit 'Reply' to respond directly to ${email}.`
    };

    // 2. Automated Confirmation Email sent to the USER
    const userConfirmationOptions = {
        from: `"Achuppori Team" <${SENDER_EMAIL}>`,
        to: email,
        replyTo: SUPPORT_INBOX,
        subject: `We have received your query - Achuppori`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 22px; border: 1px solid #e0dcd3; background-color: #ffffff;">
                <div style="background-color: #ff4d00; color: #ffffff; padding: 14px 18px; font-weight: bold; font-size: 18px;">
                    ACHUPPORI
                </div>
                <div style="padding: 22px 10px; color: #121316; line-height: 1.6;">
                    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>
                    <p>We have successfully received your query regarding <strong>"${subject}"</strong>.</p>
                    <p>Our team has received your message and will review it.</p>
                    <div style="background: #f5f2eb; padding: 14px; border-left: 4px solid #ff4d00; margin: 16px 0; font-size: 14px; color: #333;">
                        <strong>Your query summary:</strong><br />
                        ${message}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #555;">
                        Thank you for reaching out to Achuppori.<br />
                        <strong>Achuppori Team</strong>
                    </p>
                </div>
            </div>
        `,
        text: `Hello ${name},\n\nWe have received your query regarding "${subject}". Our team will review your message.\n\nThank you,\nAchuppori Team`
    };

    try {
        // Send email to support inbox
        await transporter.sendMail(teamMailOptions);
        console.log(`[Email Sent] Query from ${name} (${email}) delivered to ${SUPPORT_INBOX}`);

        // Send automated confirmation email to user
        try {
            await transporter.sendMail(userConfirmationOptions);
            console.log(`[Confirmation Sent] Response acknowledgement sent to ${email}`);
        } catch (confirmErr) {
            console.warn('[Confirmation Warning] Could not send confirmation to user:', confirmErr.message);
        }

        return res.json({
            success: true,
            message: 'Your query has been delivered.'
        });
    } catch (error) {
        console.error('Nodemailer error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to dispatch email. Check server email configuration.'
        });
    }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`🚀 Achuppori Server is active!`);
        console.log(`📡 Local Web App: http://localhost:${PORT}`);
        console.log(`✉️  Contact API:   http://localhost:${PORT}/api/contact`);
        console.log(`===============================================`);
    });
}

module.exports = app;
