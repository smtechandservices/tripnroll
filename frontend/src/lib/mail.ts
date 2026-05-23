import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOTPEmail(email: string, otp: string) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: `${otp} is your Trip N Roll Travel verification code`,
        text: `Your Trip N Roll Travel verification code is: ${otp}. This code will expire in 10 minutes.`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Trip N Roll Travel</h1>
                </div>
                
                <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h2 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 700;">Verify your email</h2>
                    <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                        Hello, thank you for signing up with Trip N Roll Travel. Please use the verification code below to complete your registration.
                    </p>
                    
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 0.25em;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; margin: 0;">
                        This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 18px;">
                        &copy; ${new Date().getFullYear()} Trip N Roll Travel. All rights reserved.<br>
                        Trip N Roll Travel, <br>
                        You are receiving this because a request was made for your account.
                    </p>
                </div>
            </div>
        `,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'Priority': 'urgent',
            'X-Message-Flag': 'Important'
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] OTP sent successfully to ${email}`);
    } catch (error) {
        console.error('[Email] Failed to send OTP:', error);
        throw new Error('Failed to send verification email. Please check your SMTP settings.');
    }
}
export async function sendPasswordResetEmail(email: string, otp: string) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: `${otp} is your Trip N Roll Travel password reset code`,
        text: `Your Trip N Roll Travel password reset code is: ${otp}. This code will expire in 10 minutes.`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Trip n Roll Travels</h1>
                </div>
                
                <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h2 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 700;">Reset your password</h2>
                    <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                        We received a request to reset your Trip N Roll Travel password. Please use the code below to proceed.
                    </p>
                    
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 0.25em;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; margin: 0;">
                        This code will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 18px;">
                        &copy; ${new Date().getFullYear()} Trip N Roll Travel. All rights reserved.<br>
                        Trip N Roll Travel, <br>
                        You are receiving this because a request was made for your account.
                    </p>
                </div>
            </div>
        `,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'Priority': 'urgent',
            'X-Message-Flag': 'Important'
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Password reset OTP sent successfully to ${email}`);
    } catch (error) {
        console.error('[Email] Failed to send password reset OTP:', error);
        throw new Error('Failed to send reset email.');
    }
}

export async function sendBookingTicketEmail(email: string, bookingId: string) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        cc: 'info@tripnrolltravel.com',
        subject: `Booking Confirmed - ${bookingId} | Trip N Roll Travel`,
        text: `Thank you for booking with Trip N Roll Travel. Your booking ${bookingId} has been successfully confirmed.`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Trip n Roll Travels</h1>
                </div>
                
                <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h2 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 700;">Booking Confirmed!</h2>
                    <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                        Thank you for choosing Trip N Roll Travel. Your booking has been successfully confirmed.
                    </p>
                    
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">Booking Reference:</p>
                        <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: 700; color: #1e293b;">${bookingId}</p>
                    </div>
                    
                    <p style="font-size: 15px; line-height: 22px; color: #475569; margin-bottom: 24px;">
                        You can view and download your E-Ticket anytime from your account dashboard under the <strong>"Bookings"</strong> tab.
                    </p>

                    <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                        <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">Next Steps:</p>
                        <ul style="font-size: 14px; color: #64748b; padding-left: 20px; margin: 0;">
                            <li>Log in to your dashboard and visit the <strong>"Bookings"</strong> tab to download your ticket.</li>
                            <li>Ensure you have a valid government-issued ID for travel.</li>
                            <li>Check the reporting time for your flight.</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 18px;">
                        &copy; ${new Date().getFullYear()} Trip N Roll Travel. All rights reserved.<br>
                        Trip N Roll Travel, <br>
                        You are receiving this because you made a booking on our platform.
                    </p>
                </div>
            </div>
        `,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'Priority': 'urgent',
            'X-Message-Flag': 'Important'
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] sent successfully to ${email}`);
    } catch (error) {
        console.error('[Email] Failed to send ticket email:', error);
        throw new Error('Failed to send ticket email.');
    }
}

export async function sendEnquiryNotificationEmail(name: string, email: string, message: string) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: 'info@tripnrolltravel.com',
        subject: `New Flyer Enquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Trip n Roll Travels</h1>
                </div>
                <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h2 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 700;">New Flyer Enquiry</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #475569; width: 80px;">Name:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #475569;">Email:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${email}</td>
                        </tr>
                    </table>
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px;">Message:</p>
                        <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-line;">${message}</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} Trip N Roll Travel. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Enquiry notification sent from ${email}`);
    } catch (error) {
        console.error('[Email] Failed to send enquiry notification:', error);
        throw new Error('Failed to send enquiry notification.');
    }
}
