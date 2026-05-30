import { NextRequest, NextResponse } from 'next/server';
import { sendAdminRefundRequestEmail, sendAdminTopUpRequestEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body;

        if (type === 'refund_request') {
            const { userName, userEmail, bookingRef, passengerCount, remarks } = body;
            if (!userEmail || !bookingRef || !passengerCount) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }
            await sendAdminRefundRequestEmail(userName, userEmail, bookingRef, passengerCount, remarks);

        } else if (type === 'topup_request') {
            const { userName, userEmail, amount, requestId, method, remarks } = body;
            if (!userEmail || !amount || !requestId || !method) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }
            await sendAdminTopUpRequestEmail(userName, userEmail, amount, requestId, method, remarks);

        } else {
            return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Notification sent' });
    } catch (error: any) {
        console.error('[Admin Notify] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
    }
}
