import { NextRequest, NextResponse } from 'next/server';
import { sendEnquiryNotificationEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 });
        }

        await sendEnquiryNotificationEmail(name, email, message);
        return NextResponse.json({ message: 'Enquiry notification sent' });
    } catch (error: any) {
        console.error('[Contact Email API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send enquiry notification' }, { status: 500 });
    }
}
