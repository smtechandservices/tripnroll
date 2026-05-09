import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, saveOTP } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists in Django
        const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        
        const { exists } = await checkRes.json();

        if (!exists) {
            // For security, still return success but don't send email
            // This prevents attackers from knowing which emails are registered
            return NextResponse.json({ message: 'If this email is registered, you will receive a code.' });
        }

        const otp = generateOTP();
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Forgot Password] OTP for ${email}: ${otp}`);
        }

        await sendPasswordResetEmail(email, otp);
        saveOTP(email, otp);

        return NextResponse.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
