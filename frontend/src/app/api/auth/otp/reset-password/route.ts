import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';

export async function POST(req: NextRequest) {
    try {
        const { email, otp, password } = await req.json();

        if (!email || !otp || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const isValid = verifyOTP(email, otp);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // OTP is valid, call Django to reset password
        const resetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!resetRes.ok) {
            const data = await resetRes.json();
            throw new Error(data.error || 'Failed to reset password in backend');
        }

        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
    }
}
