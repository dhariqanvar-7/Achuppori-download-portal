const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // Enable CORS if needed
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, email, subject, message) are required.'
        });
    }

    const SENDER_EMAIL = process.env.SENDER_EMAIL;
    const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
    const SUPPORT_INBOX = process.env.SUPPORT_INBOX;

    if (!SENDER_EMAIL || !SENDER_PASSWORD || !SUPPORT_INBOX) {
        return res.status(500).json({
            success: false,
            message: 'Email environment variables (SENDER_EMAIL, SENDER_PASSWORD, SUPPORT_INBOX) are not configured.'
        });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_PASSWORD
        }
    });

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
                    <p style="margin: 6px 0;"><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: none; border-top: 1px solid #e0dcd3; margin: 15px 0;">
                    <p style="margin: 6px 0; font-weight: bold;">Message Content:</p>
                    <div style="background-color: #f7f5f0; padding: 12px 15px; border-left: 4px solid #ff4d00; margin-top: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${message}</div>
                </div>
                <div style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; margin-top: 15px;">
                    Submitted through the Achuppori portal contact form.
                </div>
            </div>
        `,
        text: `Achuppori Support Query\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`
    };

    const userConfirmationOptions = {
        from: `"Achuppori Support" <${SENDER_EMAIL}>`,
        to: email,
        subject: `Query Received: "${subject}" [Achuppori Team]`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0dcd3; background-color: #ffffff;">
                <div style="background-color: #111; color: #fff; padding: 12px 18px; font-weight: bold; font-size: 16px;">
                    Achuppori Helpdesk
                </div>
                <div style="padding: 20px 10px;">
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Thank you for reaching out to Achuppori. We have received your query regarding:</p>
                    <blockquote style="background: #f7f5f0; border-left: 3px solid #ff4d00; padding: 8px 12px; margin: 12px 0;">
                        <strong>Subject:</strong> ${subject}
                    </blockquote>
                    <p>Our team is reviewing your message and will respond as soon as possible.</p>
                    <br>
                    <p style="margin-bottom: 2px;">Warm regards,</p>
                    <p style="margin-top: 0; font-weight: bold; color: #ff4d00;">The Achuppori Team</p>
                </div>
            </div>
        `,
        text: `Hello ${name},\n\nWe have received your query regarding "${subject}". Our team will review your message.\n\nThank you,\nAchuppori Team`
    };

    try {
        await transporter.sendMail(teamMailOptions);

        try {
            await transporter.sendMail(userConfirmationOptions);
        } catch (confirmErr) {
            console.warn('Confirmation email warning:', confirmErr.message);
        }

        return res.status(200).json({
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
};
