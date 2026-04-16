import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, User } from './api';
import { getAirlineLogo } from './airlines';

const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to fetch image:', error);
        return '';
    }
};

export const generateTicketPDF = async (bookings: Booking[], user: User | null) => {
    const doc = new jsPDF();
    const firstBooking = bookings[0];
    const flight = firstBooking.flight_details;

    // Helper to format currency
    const formatCurrency = (amount: string | number) => {
        return `RS ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    // --- Header ---
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${user?.username || 'GUEST'}`, 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ELECTRONIC TICKET / PASSENGER ITINERARY', 15, 30);
    
    doc.text(`Booking Group: ${firstBooking.booking_group || firstBooking.booking_id}`, 210 - 15, 20, { align: 'right' });
    doc.text(`Date of Issue: ${new Date(firstBooking.created_at).toLocaleDateString()}`, 210 - 15, 30, { align: 'right' });

    // --- Flight Details Section ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FLIGHT INFORMATION', 15, 50);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 52, 195, 52);

    // Flight detail boxes/layout
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, 57, 180, 60, 4, 4, 'F');
    
    // Center airline and logo
    const logoUrl = getAirlineLogo(flight.airline);
    if (logoUrl) {
        const logoBase64 = await fetchImageAsBase64(logoUrl);
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 105 - 7.5, 62, 15, 15);
        }
    }
    
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text(`${flight.airline}  •  ${flight.flight_number}`, 105, 84, { align: 'center' });
    
    // Boarding Pass Style Route
    doc.setTextColor(30, 41, 59);
    
    // Origin
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('FROM', 25, 95);
    doc.setFontSize(28); // Extra large city code
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(flight.origin, 25, 108);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const depTime = new Date(flight.departure_time);
    doc.text(`${depTime.toLocaleDateString('en-GB')} ${depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`, 25, 115);

    // Destination
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('TO', 185, 95, { align: 'right' });
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text(flight.destination, 185, 108, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const arrTime = new Date(flight.arrival_time);
    doc.text(`${arrTime.toLocaleDateString('en-GB')} ${arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`, 185, 115, { align: 'right' });

    // Center Airplane Path Icon
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(75, 103, 135, 103);
    
    // Draw small airplane (simplistic SVG-like path or emoji-ish shape)
    doc.setFillColor(37, 99, 235);
    doc.triangle(105, 100, 102, 106, 108, 106, 'F'); // Generic pointer
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(flight.duration, 105, 99, { align: 'center' });
    doc.text(flight.stops === 0 ? 'NON-STOP' : `${flight.stops} STOP(S)`, 105, 110, { align: 'center' });

    // --- Passenger Details Table ---
    // Helper to calculate age
    const getAge = (dob: string | undefined) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age}Y` : 'Infant';
    };

    const tableBody: any[] = [];
    bookings.forEach((b, index) => {
        // Primary detail row
        tableBody.push([
            { content: `${index + 1}`, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
            `${b.first_name} ${b.last_name}`,
            `${b.pnr || 'PENDING'}`,
            `${b.passport_number || 'N/A'}`,
            b.passenger_email || 'N/A',
            { content: formatCurrency(b.charged_price || b.flight_details.price), rowSpan: 2, styles: { valign: 'middle', halign: 'right', fontStyle: 'bold' } }
        ]);
        // Support detail row
        tableBody.push([
            `Age: ${getAge(b.date_of_birth)}`,
            `TXN: ${b.booking_id}`,
            `Exp: ${b.passport_expiry_date || 'N/A'}`,
            b.passenger_phone || 'N/A'
        ]);
    });

    autoTable(doc, {
        startY: 140,
        head: [['#', 'Name', 'PNR / Transaction', 'Passport Details', 'Contact Email/Phone', 'Price']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 10, halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 10 },
            5: { cellWidth: 35 }
        },
        didParseCell: (data) => {
            // Apply styling to the support row (every even row in the body, which is 1-indexed for jspdf-autotable logic if we count from 0)
            // But since we pushed 2 rows per passenger, index 0,2,4... are primary, 1,3,5... are support
            if (data.section === 'body' && data.row.index % 2 !== 0) {
                data.cell.styles.fontSize = 7.5;
                data.cell.styles.textColor = [100, 116, 139]; // slate-500
                data.cell.styles.fontStyle = 'italic';
            }
        }
    });

    // --- Footer Summary ---
    // @ts-ignore - lastAutoTable is injected by the plugin
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setDrawColor(37, 99, 235);
    doc.line(130, finalY, 195, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 160, finalY + 10, { align: 'right' });
    
    const totalPrice = bookings.reduce((sum, b) => sum + Number(b.charged_price || b.flight_details.price), 0);
    doc.text(formatCurrency(totalPrice), 195, finalY + 10, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT PAID:', 160, finalY + 20, { align: 'right' });
    doc.setTextColor(37, 99, 235);
    doc.text(formatCurrency(totalPrice), 195, finalY + 20, { align: 'right' });

    // Important Notice
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Travel Safely ~ TRIP N ROLL TRAVEL', 105, 275, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text('This is a computer-generated document. No signature is required. Please carry a valid photo ID along with this ticket for travel.', 105, 282, { align: 'center' });

    // Download the PDF
    doc.save(`Ticket_${firstBooking.booking_group || firstBooking.booking_id}.pdf`);
};
