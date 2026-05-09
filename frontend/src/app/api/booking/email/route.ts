import { NextRequest, NextResponse } from 'next/server';
import { sendBookingTicketEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    try {
        const { bookings, user, includePrice } = await req.json();

        if (!bookings || !bookings.length) {
            return NextResponse.json({ error: 'Bookings are required' }, { status: 400 });
        }

        const primaryPassenger = bookings[0];
        const email = primaryPassenger.passenger_email;

        if (!email) {
            return NextResponse.json({ error: 'Primary passenger email is missing' }, { status: 400 });
        }

        const bookingId = primaryPassenger.booking_group || primaryPassenger.booking_id;
        const authToken = req.headers.get('Authorization');

        console.log(`[Email API] Sending confirmation email to ${email} for booking ${bookingId}...`);
        await sendBookingTicketEmail(email, bookingId);

        return NextResponse.json({ message: 'Ticket email sent successfully' });
    } catch (error: any) {
        console.error('[Email API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send ticket email' }, { status: 500 });
    }
}
