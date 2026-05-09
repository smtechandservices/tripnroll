import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, saveOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const { email, username } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user already exists in backend
        try {
            const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-email/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username })
            });

            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.email_exists && checkData.username_exists) {
                    return NextResponse.json({ error: 'Both username and email already exist' }, { status: 400 });
                }
                if (checkData.email_exists) {
                    return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
                }
                if (checkData.username_exists) {
                    return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
                }
            }
        } catch (error) {
            console.error('Check user existence failed:', error);
        }

        const otp = generateOTP();
        
        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${email}: ${otp}`);
        }

        await sendOTPEmail(email, otp);

        // Save OTP in memory
        saveOTP(email, otp);

        return NextResponse.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Send OTP Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
    }
}
