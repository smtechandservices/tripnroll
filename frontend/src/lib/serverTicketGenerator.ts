import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, User } from './api';
import { getAirlineLogo } from './airlines';

// Server-side image fetcher (no FileReader)
const fetchImageAsBase64 = async (url: string, authToken?: string | null): Promise<string> => {
    try {
        let finalUrl = url;
        if (url.startsWith('/')) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            finalUrl = `${baseUrl.endsWith('/api') ? baseUrl.replace('/api', '') : baseUrl}${url}`;
        }

        const headers: Record<string, string> = {};
        if (authToken && (finalUrl.includes('/api/') || finalUrl.includes('/media/'))) {
            headers['Authorization'] = authToken;
        }

        const response = await fetch(finalUrl, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`Failed to fetch image on server (${url}):`, error);
        return '';
    }
};

export const generateTicketPDFBuffer = async (
    bookings: Booking[], 
    user: User | null, 
    includePrice: boolean = true,
    authToken?: string | null
): Promise<Buffer> => {
    // jsPDF in node might need some adjustments, but let's try standard first
    const doc = new jsPDF();
    const firstBooking = bookings[0];
    const flight = firstBooking.flight_details;

    const formatCurrency = (amount: string | number) => {
        return `RS ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    let currentY = 57;

    const ensureSpace = (height: number) => {
        if (currentY + height > 270) {
            doc.addPage();
            currentY = 20;
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, 210, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`E-Ticket Continued | Ref: ${firstBooking.booking_group || firstBooking.booking_id}`, 105, 6.5, { align: 'center' });
            currentY = 20;
        }
    };

    // --- Header ---
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    let usernameX = 15;
    if (user?.profile?.brand_logo) {
        // Handle absolute URL if needed
        const logoUrl = user.profile.brand_logo.startsWith('http') ? user.profile.brand_logo : `${process.env.NEXT_PUBLIC_API_URL}${user.profile.brand_logo}`;
        const brandLogoBase64 = await fetchImageAsBase64(logoUrl, authToken);
        if (brandLogoBase64) {
            doc.addImage(brandLogoBase64, 'PNG', 15, 10, 12, 12);
            usernameX = 30;
        }
    }
    
    doc.text(`${user?.username || 'GUEST'}`, usernameX, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ELECTRONIC TICKET / PASSENGER ITINERARY', 15, 30);
    
    doc.text(`Booking Group: ${firstBooking.booking_group || firstBooking.booking_id}`, 210 - 15, 20, { align: 'right' });
    doc.text(`Date of Issue: ${new Date(firstBooking.created_at).toLocaleDateString()}`, 210 - 15, 30, { align: 'right' });

    // --- Flight Details ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('FLIGHT INFORMATION', 15, 50);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 52, 195, 52);

    let legs: any[] = [];
    try {
        if (flight.stop_info) legs = JSON.parse(flight.stop_info);
    } catch (e) {}

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, currentY, 180, 42, 3, 3, 'F');
    
    const airlinesInfo = legs.length > 0 ? legs.map(l => ({ name: l.airline || flight.airline, number: l.flight_number })) : [{ name: flight.airline, number: flight.flight_number }];
    
    let logoX = 20;
    for (const info of airlinesInfo) {
        const logoUrl = getAirlineLogo(info.name);
        if (logoUrl) {
            const logoBase64 = await fetchImageAsBase64(logoUrl, authToken);
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', logoX, currentY + 8, 12, 12);
                logoX += 14;
            }
        }
    }
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    if (airlinesInfo.length <= 2) {
        doc.setFontSize(18);
        doc.text(Array.from(new Set(airlinesInfo.map(a => a.name))).join(' / '), 20, currentY + 28);
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'normal');
        doc.text(`Flight(s): ${airlinesInfo.map(a => a.number).join(' | ')}`, 20, currentY + 35);
    } else {
        doc.setFontSize(14);
        doc.text(Array.from(new Set(airlinesInfo.map(a => a.name))).join(', '), 20, currentY + 28);
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'normal');
        doc.text(`Flights: ${airlinesInfo.map(a => a.number).join(' / ')}`, 20, currentY + 36);
    }

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('TRAVEL SPECIFICATIONS', 140, currentY + 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Baggage: ${flight.baggage_allowance || '15kg Check-in / 7kg Cabin'}`, 140, currentY + 16);
    doc.text(`Ref. PNR: ${firstBooking.pnr || 'GENERATING'}`, 140, currentY + 22);
    doc.text(`Stops: ${flight.stops === 0 ? 'Direct' : `${flight.stops} Connection(s)`}`, 140, currentY + 28);

    currentY += 55;

    // Detailed Itinerary
    if (legs.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('DETAILED ITINERARY', 15, currentY);
        currentY += 8;

        for (const [index, leg] of legs.entries()) {
            ensureSpace(35);
            doc.setDrawColor(241, 245, 249);
            doc.roundedRect(15, currentY, 180, 25, 2, 2, 'S');
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(leg.origin, 22, currentY + 10);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.text(`Terminal: ${leg.departure_terminal || 'Main'}`, 22, currentY + 15);
            doc.text(`${leg.date_departure} | ${leg.time_departure}`, 22, currentY + 20);

            doc.setTextColor(37, 99, 235);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`${leg.airline} ${leg.flight_number}`, 105, currentY + 10, { align: 'center' });

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.text(leg.destination, 188, currentY + 10, { align: 'right' });
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.text(`Terminal: ${leg.arrival_terminal || 'Main'}`, 188, currentY + 15, { align: 'right' });
            doc.text(`${leg.date_arrival} | ${leg.time_arrival}`, 188, currentY + 20, { align: 'right' });

            currentY += 25;
            if (index < legs.length - 1) {
                currentY += 15;
            }
        }
        currentY += 5;
    } else {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, currentY, 180, 48, 4, 4, 'F');
        doc.setFontSize(28);
        doc.setTextColor(15, 23, 42);
        doc.text(flight.origin, 25, currentY + 25);
        doc.text(flight.destination, 185, currentY + 25, { align: 'right' });
        currentY += 58;
    }

    const tableHeader = includePrice 
        ? [['#', 'Name', 'PNR Info', 'Documents', 'Profile', 'Price']]
        : [['#', 'Name', 'PNR Info', 'Documents', 'Profile']];

    const tableBody: any[] = [];
    bookings.forEach((b, index) => {
        tableBody.push([
            { content: `${index + 1}`, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
            `${b.first_name} ${b.last_name}`,
            `${b.pnr || 'PENDING'}`,
            `${b.passport_number || 'N/A'}`,
            b.passenger_email || 'N/A',
            ...(includePrice ? [{ content: formatCurrency(b.charged_price || b.flight_details.price), rowSpan: 2, styles: { valign: 'middle', halign: 'right', fontStyle: 'bold' } }] : [])
        ]);
        tableBody.push([
            `Age: ${b.date_of_birth}`,
            `TXN ID: ${b.booking_id}`,
            `Passport Exp: ${b.passport_expiry_date || 'N/A'}`,
            `Phone: ${b.passenger_phone || 'N/A'}`
        ]);
    });

    autoTable(doc, {
        startY: currentY,
        head: tableHeader,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 10, halign: 'center' },
        styles: { fontSize: 8.5, cellPadding: 3 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;
    
    if (includePrice) {
        const totalPrice = bookings.reduce((sum, b) => sum + Number(b.charged_price || b.flight_details.price), 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PAID:', 160, currentY + 10, { align: 'right' });
        doc.setTextColor(37, 99, 235);
        doc.text(formatCurrency(totalPrice), 195, currentY + 10, { align: 'right' });
    }

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text('Travel Safely with TRIP N ROLL TRAVEL', 105, 282, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};
