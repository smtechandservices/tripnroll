import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, User } from './api';
import { getAirlineLogo, getAirlineBranding } from './airlines';

const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const headers: Record<string, string> = {};
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && (url.includes('/api/') || url.startsWith('/'))) {
                headers['Authorization'] = `Token ${token}`;
            }
        }
        const response = await fetch(url, { headers });
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return '';
    }
};

const formatDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}-${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
};

const formatTime = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    } catch {
        return dateStr;
    }
};

// Parse "DD/MM/YYYY" stop_info date format
const parseLegDate = (dateStr: string): string => {
    try {
        const [d, m, y] = dateStr.split('/');
        const date = new Date(`${y}-${m}-${d}`);
        return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}-${date.getFullYear()}`;
    } catch {
        return dateStr;
    }
};

// Format "HH:MM" time from stop_info
const formatLegTime = (timeStr: string): string => {
    try {
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        return `${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
        return timeStr;
    }
};

export const generateTicketPDF = async (bookings: Booking[], user: User | null, includePrice: boolean = true) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const firstBooking = bookings[0];
    const flight = firstBooking.flight_details;
    const airlineName = flight.airline || 'AIRLINE';
    const branding = getAirlineBranding(airlineName);
    const [pr, pg, pb] = branding.primaryColor;
    const [ar, ag, ab] = branding.accentColor;

    const formatCurrency = (amount: string | number) =>
        `RS ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Parse legs
    let legs: any[] = [];
    try {
        if (flight.stop_info) legs = JSON.parse(flight.stop_info);
    } catch { /* ignore */ }

    let currentY = 0;

    // ── HEADER ────────────────────────────────────────────────────────────────
    const HEADER_H = 28;
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 0, W, HEADER_H, 'F');

    // Airline logo
    const logoUrl = getAirlineLogo(airlineName);
    let logoLoaded = false;
    if (logoUrl) {
        const logoBase64 = await fetchImageAsBase64(logoUrl);
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 8, 4, 20, 20);
            logoLoaded = true;
        }
    }

    // Airline name
    const nameX = logoLoaded ? 32 : 10;
    doc.setTextColor(...branding.headerTextColor as [number, number, number]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(airlineName.replace(/\b\w/g, c => c.toUpperCase()), nameX, 14);

    if (branding.tagline) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(branding.tagline, nameX, 21);
    }

    // Right side: brand logo + username + Reservations label
    let rightContentX = W - 10;
    if (user?.profile?.brand_logo) {
        const brandBase64 = await fetchImageAsBase64(user.profile.brand_logo);
        if (brandBase64) {
            doc.addImage(brandBase64, 'PNG', W - 30, 4, 20, 12);
        }
    }
    doc.setTextColor(...branding.headerTextColor as [number, number, number]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Reservations (24/7)', rightContentX, 19, { align: 'right' });
    if (user?.username) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(user.username.toUpperCase(), rightContentX, 25, { align: 'right' });
    }

    currentY = HEADER_H + 5;

    // ── NON-REFUNDABLE NOTICE ─────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text('Ticket is Non Refundable / Non Changeable / Non Cancellable.', 10, currentY);
    currentY += 5;

    // COVID notice
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(pr, pg, pb);
    doc.text(
        'COVID-19 UPDATE : WEB-CHECKIN is mandatory to board flight with applicable charges. Kindly contact your travel agent for more information.',
        10, currentY,
        { maxWidth: W - 20 }
    );
    currentY += 9;

    // ── BOOKING INFO ROW ─────────────────────────────────────────────────────
    const bookingInfoY = currentY;
    const cellW = (W - 20) / 4;
    const cellH = 10;
    const labels = ['Airline PNR Number', 'Booked on', 'Status', 'Booking ID'];
    const values = [
        firstBooking.pnr || 'PENDING',
        formatDate(firstBooking.created_at),
        firstBooking.status === 'CONFIRMED' ? 'Confirmed' : (firstBooking.status || 'Confirmed'),
        firstBooking.booking_group || firstBooking.booking_id,
    ];

    for (let i = 0; i < 4; i++) {
        const x = 10 + i * cellW;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(x, bookingInfoY, cellW, cellH, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(labels[i], x + 2, bookingInfoY + 3.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(20, 20, 20);
        doc.text(String(values[i]), x + 2, bookingInfoY + 8);
    }
    currentY = bookingInfoY + cellH + 6;

    // ── PASSENGERS SECTION ────────────────────────────────────────────────────
    const activeBookings = bookings.filter(b => b.status !== 'REFUNDED');

    doc.setFillColor(245, 245, 245);
    doc.rect(10, currentY, W - 20, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text('Passenger(s) Information', 13, currentY + 5);
    currentY += 7;

    for (const b of activeBookings) {
        const fullName = `${b.first_name} ${b.last_name}`.toUpperCase();

        // Derive passenger type and age from DOB
        let passengerType = 'ADULT';
        let ageStr = '';
        if (b.date_of_birth) {
            const dob = new Date(b.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            if (age >= 0) {
                ageStr = `${age} yrs`;
                if (age < 2) passengerType = 'INFANT';
                else if (age < 18) passengerType = 'CHILD';
                else passengerType = 'ADULT';
            }
        }

        // Name row
        const NAME_ROW_H = 10;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(10, currentY, W - 20, NAME_ROW_H, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text(fullName, 13, currentY + 6.5);
        const nameWidth = doc.getTextWidth(fullName);

        // Passenger type badge (measured after name width captured)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(passengerType, 13 + nameWidth + 3, currentY + 6.5);

        // PNR on right
        if (b.pnr) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(`PNR: ${b.pnr}`, W - 12, currentY + 6.5, { align: 'right' });
        }
        currentY += NAME_ROW_H;

        // Details sub-row
        const details: string[] = [];
        if (b.date_of_birth) details.push(`DOB: ${formatDate(b.date_of_birth)}${ageStr ? ` (${ageStr})` : ''}`);
        if (b.passport_number) details.push(`Passport: ${b.passport_number}`);
        if (b.passport_expiry_date) details.push(`Exp: ${formatDate(b.passport_expiry_date)}`);
        if (b.passenger_phone) details.push(`Phone: ${b.passenger_phone}`);
        if (b.passenger_email) details.push(`Email: ${b.passenger_email}`);

        if (details.length > 0) {
            const DETAIL_ROW_H = 8;
            doc.setFillColor(252, 252, 252);
            doc.rect(10, currentY, W - 20, DETAIL_ROW_H, 'FD');
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(80, 80, 80);

            // Split into two columns if many details
            const col1 = details.slice(0, Math.ceil(details.length / 2));
            const col2 = details.slice(Math.ceil(details.length / 2));
            doc.text(col1.join('   |   '), 13, currentY + 5.5);
            if (col2.length > 0) {
                doc.text(col2.join('   |   '), W / 2 + 5, currentY + 5.5);
            }
            currentY += DETAIL_ROW_H;
        }
    }
    currentY += 5;

    // ── FLIGHT TABLE ──────────────────────────────────────────────────────────
    const flightRows: string[][] = [];

    if (legs.length > 0) {
        for (const leg of legs) {
            flightRows.push([
                parseLegDate(leg.date_departure),
                `${leg.origin} // ${leg.destination}`,
                formatLegTime(leg.time_departure),
                formatLegTime(leg.time_arrival),
                leg.flight_number || flight.flight_number,
            ]);
        }
    } else {
        flightRows.push([
            formatDate(flight.departure_time),
            `${flight.origin} // ${flight.destination}`,
            formatTime(flight.departure_time),
            formatTime(flight.arrival_time),
            flight.flight_number,
        ]);
    }

    autoTable(doc, {
        startY: currentY,
        head: [['TRAVEL DATE', 'SECTOR', 'DEP TIME', 'ARR TIME', 'FLIGHT NO.']],
        body: flightRows,
        theme: 'grid',
        headStyles: {
            fillColor: [pr, pg, pb],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 3,
        },
        bodyStyles: {
            fontSize: 9,
            halign: 'center',
            cellPadding: 3,
            textColor: [20, 20, 20],
        },
        columnStyles: {
            1: { halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: 10, right: 10 },
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 6;

    currentY += 4;

    // ── PRICE SECTION (optional) ──────────────────────────────────────────────
    if (includePrice) {
        const totalPrice = bookings.reduce((sum, b) => sum + Number(b.charged_price || b.flight_details.price), 0);
        const totalRefunded = bookings.reduce((sum, b) => sum + Number(b.refunded_amount || 0), 0);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text('Total Fare:', W - 60, currentY);
        doc.setTextColor(ar, ag, ab);
        doc.setFontSize(10);
        doc.text(formatCurrency(totalPrice), W - 10, currentY, { align: 'right' });

        if (totalRefunded > 0) {
            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(180, 30, 30);
            doc.text(`Refunded: -${formatCurrency(totalRefunded)}`, W - 10, currentY, { align: 'right' });
        }
        currentY += 6;
    }

    // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
    const terms = [
        'This group ticket is 100% Non Refundable, Non Changeable & Non Cancellable.',
        'Charged fare is totally agreed between "BUYER & SELLER", any issues related to fares thereafter will not be entertained.',
        'Check flight & passenger(s) details directly by logging / calling to the respective airlines; any dispute within 24 hours prior to departure will not be entertained.',
        'No updates will be shared from our end in respect to flight cancellation / changes in timings, "BUYER" had to check directly with the airlines before departure.',
        'COVID-19 UPDATE : Web checkin is mandatory to board flight. Kindly contact your travel agent 24hr prior to departure.',
    ];

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);

    const termsBoxH = 6 + terms.length * 5.5;
    if (currentY + termsBoxH > 270) { doc.addPage(); currentY = 15; }
    doc.rect(10, currentY, W - 20, termsBoxH + 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text('Terms & Conditions', 13, currentY + 5);
    let tY = currentY + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 40);
    terms.forEach((t, i) => {
        doc.text(`${i + 1}. ${t}`, 13, tY, { maxWidth: W - 26 });
        tY += 5.5;
    });
    currentY += termsBoxH + 6;

    // ── IMPORTANT INFORMATION ─────────────────────────────────────────────────
    const important = [
        'Valid Govt. ID proof required at the time of Boarding.',
        `Free Baggage allowance is ${flight.baggage_allowance || '15 Kg'} & Hand Baggage allowance is 7 Kg.`,
    ];

    const impBoxH = 6 + important.length * 5.5;
    if (currentY + impBoxH > 270) { doc.addPage(); currentY = 15; }
    doc.setDrawColor(180, 180, 180);
    doc.rect(10, currentY, W - 20, impBoxH + 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text('Important Information', 13, currentY + 5);
    let iY = currentY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 40);
    important.forEach((t, i) => {
        doc.text(`${i + 1}. ${t}`, 13, iY, { maxWidth: W - 26 });
        iY += 5.5;
    });
    currentY += impBoxH + 6;

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 287, W, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...branding.headerTextColor as [number, number, number]);
    doc.text('This is a computer-generated e-ticket. Present this along with a valid photo ID at check-in.', 105, 293, { align: 'center' });

    doc.save(`Ticket_${firstBooking.booking_group || firstBooking.booking_id}.pdf`);
};
