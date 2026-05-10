import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, saveOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // 1. Verify credentials with backend
        try {
            const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!loginRes.ok) {
                const errorData = await loginRes.json();
                return NextResponse.json({ error: errorData.error || 'Invalid credentials' }, { status: 401 });
            }
            
            // Credentials are valid. We don't use the token yet.
        } catch (error) {
            console.error('Credential verification failed:', error);
            return NextResponse.json({ error: 'Verification service unavailable' }, { status: 500 });
        }

        // 2. Generate and send OTP
        const otp = generateOTP();
        
        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`Login OTP for ${email}: ${otp}`);
        }

        await sendOTPEmail(email, otp);

        // 3. Save OTP in memory
        saveOTP(email, otp);

        return NextResponse.json({ message: 'OTP sent successfully', otp_sent: true });
    } catch (error: any) {
        console.error('Login Verify Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to initialize login' }, { status: 500 });
    }
}
