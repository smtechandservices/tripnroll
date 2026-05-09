import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';

export async function POST(req: NextRequest) {
    try {
        const { email, otp, deleteAfter = true } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const isValid = verifyOTP(email, otp, deleteAfter);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // OTP is valid
        return NextResponse.json({ message: 'OTP verified successfully', verified: true });
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
