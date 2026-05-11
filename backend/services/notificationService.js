const nodemailer = require('nodemailer');
const logger = require('../utils/winstonLogger');

/**
 * Notification Service
 * Handles Email and SMS (Mock) delivery across the platform.
 */
class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
            port: process.env.EMAIL_PORT || 2525,
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || ''
            }
        });
    }

    /**
     * Send Generic Email
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const info = await this.transporter.sendMail({
                from: `"RestoLedger Security" <${process.env.EMAIL_FROM || 'no-reply@restoledger.com'}>`,
                to,
                subject,
                text,
                html
            });
            logger.info(`Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (err) {
            logger.error(`Failed to send email to ${to}: ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    /**
     * Send Welcome Email to new Shop
     */
    async sendWelcomeEmail(shopAdminEmail, shopName, adminName) {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Welcome to RestoLedger POS!</h2>
                <p>Hello <b>${adminName}</b>,</p>
                <p>Congratulations! Your shop <b>${shopName}</b> is now live on our platform.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><b>Shop Dashboard:</b> <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
                </div>
                <p>Our team is here to help you grow your business. If you have any questions, simply reply to this email or open a support ticket.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">RestoLedger SaaS Team</p>
            </div>
        `;
        return this.sendEmail({
            to: shopAdminEmail,
            subject: `Welcome to RestoLedger - ${shopName}`,
            html
        });
    }

    /**
     * Send Subscription Expiry Warning
     */
    async sendExpiryWarning(email, shopName, daysRemaining) {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px; border-left: 5px solid #ef4444;">
                <h2 style="color: #ef4444;">Action Required: Subscription Expiring</h2>
                <p>Hello,</p>
                <p>Your subscription for <b>${shopName}</b> will expire in <b>${daysRemaining} days</b>.</p>
                <p>To avoid any service interruption and keep your POS active, please renew your plan as soon as possible.</p>
                <a href="${process.env.FRONTEND_URL}/settings" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Renew Subscription</a>
                <p style="font-size: 12px; color: #666; margin-top: 30px;">RestoLedger Billing Dept.</p>
            </div>
        `;
        return this.sendEmail({
            to: email,
            subject: `IMPORTANT: Subscription for ${shopName} expires in ${daysRemaining} days`,
            html
        });
    }

    /**
     * Send Payment Receipt
     */
    async sendPaymentReceipt(email, shopName, amount, planName, expiryDate) {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #10b981;">Payment Received</h2>
                <p>Thank you for your payment for <b>${shopName}</b>.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f9fafb;"><td style="padding: 10px;">Plan</td><td style="padding: 10px; text-align: right;">${planName}</td></tr>
                    <tr><td style="padding: 10px;">Amount Paid</td><td style="padding: 10px; text-align: right;"><b>LKR ${amount}</b></td></tr>
                    <tr style="background: #f9fafb;"><td style="padding: 10px;">Valid Until</td><td style="padding: 10px; text-align: right;">${new Date(expiryDate).toLocaleDateString()}</td></tr>
                </table>
                <p>Your account has been updated successfully.</p>
                <p style="font-size: 12px; color: #666;">RestoLedger SaaS Team</p>
            </div>
        `;
        return this.sendEmail({
            to: email,
            subject: `Payment Receipt - ${shopName}`,
            html
        });
    }

    /**
     * Send 2FA OTP
     */
    async send2FAOTP(email, otp) {
        const html = `
            <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 15px; text-align: center; background: #0f172a; color: white;">
                <h2 style="color: #6366f1;">Security Verification</h2>
                <p style="color: #94a3b8;">Enter the code below to complete your login.</p>
                <div style="font-size: 32px; font-weight: 900; letter-spacing: 5px; background: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0; color: #fff; border: 1px solid #334155;">
                    ${otp}
                </div>
                <p style="font-size: 11px; color: #64748b;">This code will expire in 5 minutes. If you did not request this, please secure your account immediately.</p>
            </div>
        `;
        // Also log for local dev
        console.log(`>>> SECURITY OTP FOR ${email}: [ ${otp} ]`);
        
        return this.sendEmail({
            to: email,
            subject: `RestoLedger Verification Code: ${otp}`,
            html
        });
    }

    /**
     * Mock SMS Sender
     */
    async sendSMS(to, message) {
        // In production, integrate with Twilio/Dialog/etc.
        logger.info(`[SMS MOCK] Sending to ${to}: ${message}`);
        console.log(`\n📱 [SMS MOCK] To: ${to}\n💬 Message: ${message}\n`);
        return { success: true };
    }
}

module.exports = new NotificationService();
