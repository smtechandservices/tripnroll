import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, User } from './api';
import { getAirlineLogo } from './airlines';

const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const headers: Record<string, string> = {};
        
        // Add auth token if it's an internal API request
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
    } catch (error) {
        console.error('Failed to fetch image:', error);
        return '';
    }
};

export const generateTicketPDF = async (bookings: Booking[], user: User | null, includePrice: boolean = true) => {
    const doc = new jsPDF();
    const firstBooking = bookings[0];
    const flight = firstBooking.flight_details;

    // Helper to format currency
    const formatCurrency = (amount: string | number) => {
        return `RS ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    let currentY = 57;

    // Helper for pagination
    const ensureSpace = (height: number) => {
        if (currentY + height > 270) {
            doc.addPage();
            currentY = 20;
            // Minimal header for continued pages
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
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    let usernameX = 15;
    if (user?.profile?.brand_logo) {
        const brandLogoBase64 = await fetchImageAsBase64(user.profile.brand_logo);
        if (brandLogoBase64) {
            doc.addImage(brandLogoBase64, 'PNG', 15, 10, 12, 12);
            usernameX = 30; // Shift username to make room for logo
        }
    }
    
    doc.text(`${user?.username || 'GUEST'}`, usernameX, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const headerTitleX = 15;
    doc.text('ELECTRONIC TICKET / PASSENGER ITINERARY', headerTitleX, 30);
    
    doc.text(`Booking Group: ${firstBooking.booking_group || firstBooking.booking_id}`, 210 - 15, 20, { align: 'right' });
    doc.text(`Date of Issue: ${new Date(firstBooking.created_at).toLocaleDateString()}`, 210 - 15, 30, { align: 'right' });

    // --- Flight Details Section ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FLIGHT INFORMATION', 15, 50);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 52, 195, 52);

    // Parse legs early for header info and layover calculation
    let legs: any[] = [];
    try {
        if (flight.stop_info) {
            legs = JSON.parse(flight.stop_info);
        }
    } catch (e) {
        console.error("Failed to parse stop_info", e);
    }

    // Calculate total/formatted layover for the header specs
    let headerLayover = flight.layover_duration || '';
    if (!headerLayover && legs.length > 1) {
        const layoverStrings = [];
        for (let i = 0; i < legs.length - 1; i++) {
            const leg = legs[i];
            const nextLeg = legs[i + 1];
            try {
                const [d, m, y] = leg.date_arrival.split('/');
                const arrivalTime = new Date(`${y}-${m}-${d}T${leg.time_arrival}`);
                const [nd, nm, ny] = nextLeg.date_departure.split('/');
                const departureTime = new Date(`${ny}-${nm}-${nd}T${nextLeg.time_departure}`);
                
                const diffMs = departureTime.getTime() - arrivalTime.getTime();
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (diffHrs >= 0 && diffMins >= 0) {
                    layoverStrings.push(`${diffHrs}h ${diffMins}m`);
                }
            } catch (e) {}
        }
        headerLayover = layoverStrings.join(', ');
    }

    // Premium Header/Branding Area
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, currentY, 180, 42, 3, 3, 'F');
    
    // Aggregate Airline Info
    const airlinesInfo = legs.length > 0 ? legs.map(l => ({ name: l.airline || flight.airline, number: l.flight_number })) : [{ name: flight.airline, number: flight.flight_number }];
    
    // Show Logos (Top Left)
    let logoX = 20;
    for (const info of airlinesInfo) {
        const logoUrl = getAirlineLogo(info.name);
        if (logoUrl) {
            const logoBase64 = await fetchImageAsBase64(logoUrl);
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', logoX, currentY + 8, 12, 12);
                logoX += 14;
            }
        }
    }
    
    // Airline & Flight Number Summary
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    
    if (airlinesInfo.length <= 2) {
        doc.setFontSize(18);
        const combinedAirlines = Array.from(new Set(airlinesInfo.map(a => a.name))).join(' / ');
        doc.text(combinedAirlines, 20, currentY + 28);
        
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'normal');
        const combinedNumbers = airlinesInfo.map(a => a.number).join(' | ');
        doc.text(`Flight(s): ${combinedNumbers}`, 20, currentY + 35);
    } else {
        doc.setFontSize(14);
        const combinedAirlines = Array.from(new Set(airlinesInfo.map(a => a.name))).join(', ');
        doc.text(combinedAirlines, 20, currentY + 28);
        
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'normal');
        const combinedNumbers = airlinesInfo.map(a => a.number).join(' / ');
        doc.text(`Flights: ${combinedNumbers}`, 20, currentY + 36);
    }

    // Bookend Terminals & Baggage Summary (Shifted right)
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('TRAVEL SPECIFICATIONS', 140, currentY + 10);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Baggage: ${flight.baggage_allowance || '15kg Check-in / 7kg Cabin'}`, 140, currentY + 16);
    doc.text(`Ref. PNR: ${firstBooking.pnr || 'GENERATING'}`, 140, currentY + 22);
    doc.text(`Stops: ${flight.stops === 0 ? 'Direct' : `${flight.stops} Connection(s)`}`, 140, currentY + 28);
    if (headerLayover) {
        doc.text(`Layover: ${headerLayover}`, 140, currentY + 34);
    }

    currentY += 55;

    // Helper: Parse stop_info and render legs
    const renderItinerary = async () => {
        let legs: any[] = [];
        try {
            if (flight.stop_info) {
                legs = JSON.parse(flight.stop_info);
            }
        } catch (e) {
            console.error("Failed to parse stop_info", e);
        }

        if (legs.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text('DETAILED ITINERARY', 15, currentY);
            currentY += 8;

            for (const [index, leg] of legs.entries()) {
                ensureSpace(35); // Card + Space
                // Leg Container
                doc.setDrawColor(241, 245, 249);
                doc.setLineWidth(0.5);
                doc.roundedRect(15, currentY, 180, 25, 2, 2, 'S');
                
                // Origin Side
                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(leg.origin, 22, currentY + 10);
                
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.setFont('helvetica', 'normal');
                doc.text(`Terminal: ${leg.departure_terminal || 'Main'}`, 22, currentY + 15);
                doc.text(`${leg.date_departure} | ${leg.time_departure}`, 22, currentY + 20);

                // Middle: Flight Detail
                doc.setDrawColor(226, 232, 240);
                doc.line(75, currentY + 12, 135, currentY + 12);
                doc.setTextColor(37, 99, 235);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                
                const legAirline = leg.airline || flight.airline;
                doc.text(`${legAirline} ${leg.flight_number}`, 105, currentY + 10, { align: 'center' });
                
                // Leg-specific logo?
                const legLogoUrl = getAirlineLogo(legAirline);
                if (legLogoUrl) {
                    const legLogoBase64 = await fetchImageAsBase64(legLogoUrl);
                    if (legLogoBase64) {
                        doc.addImage(legLogoBase64, 'PNG', 105 - 4, currentY + 1, 8, 8);
                    }
                }

                // Destination Side
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(12);
                doc.text(leg.destination, 188, currentY + 10, { align: 'right' });
                
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.setFont('helvetica', 'normal');
                doc.text(`Terminal: ${leg.arrival_terminal || 'Main'}`, 188, currentY + 15, { align: 'right' });
                doc.text(`${leg.date_arrival} | ${leg.time_arrival}`, 188, currentY + 20, { align: 'right' });

                currentY += 25;

                // Layover bar - only show city, duration moved to header specs
                if (index < legs.length - 1) {
                    ensureSpace(12);
                    currentY += 3;
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, currentY, 180, 8, 'F');
                    doc.setTextColor(148, 163, 184);
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7.5);
                    doc.text(`Layover in ${leg.destination}`, 105, currentY + 5.5, { align: 'center' });
                    currentY += 12;
                }
            }
            currentY += 5;
        } else {
            // High-detail Fallback (Direct Flights)
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(15, currentY, 180, 48, 4, 4, 'F');
            
            doc.setFontSize(28);
            doc.setTextColor(15, 23, 42);
            doc.text(flight.origin, 25, currentY + 25);
            doc.text(flight.destination, 185, currentY + 25, { align: 'right' });
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Terminal: ${flight.departure_terminal || 'N/A'}`, 25, currentY + 32);
            doc.text(`Terminal: ${flight.arrival_terminal || 'N/A'}`, 185, currentY + 32, { align: 'right' });
            
            // Format Dates/Times for Direct Flights
            const depDate = new Date(flight.departure_time);
            const arrDate = new Date(flight.arrival_time);
            const depStr = `${String(depDate.getDate()).padStart(2, '0')}/${String(depDate.getMonth() + 1).padStart(2, '0')}/${depDate.getFullYear()} | ${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`;
            const arrStr = `${String(arrDate.getDate()).padStart(2, '0')}/${String(arrDate.getMonth() + 1).padStart(2, '0')}/${arrDate.getFullYear()} | ${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`;
            
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text(depStr, 25, currentY + 38);
            doc.text(arrStr, 185, currentY + 38, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(37, 99, 235);
            doc.text(`${flight.airline} ${flight.flight_number} (Direct Flight)`, 105, currentY + 23, { align: 'center' });
            
            currentY += 58;
        }
    };

    // Render the itinerary
    await renderItinerary();

    // --- Passenger Details Table ---
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

    const tableHeader = includePrice 
        ? [['#', 'Name', 'PNR Info', 'Documents', 'Profile', 'Price']]
        : [['#', 'Name', 'PNR Info', 'Documents', 'Profile']];

    const tableBody: any[] = [];
    bookings.forEach((b, index) => {
        if (includePrice) {
            tableBody.push([
                { content: `${index + 1}`, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
                `${b.first_name} ${b.last_name}`,
                `${b.pnr || 'PENDING'}`,
                `${b.passport_number || 'N/A'}`,
                b.passenger_email || 'N/A',
                { content: formatCurrency(b.charged_price || b.flight_details.price), rowSpan: 2, styles: { valign: 'middle', halign: 'right', fontStyle: 'bold' } }
            ]);
        } else {
            tableBody.push([
                { content: `${index + 1}`, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
                `${b.first_name} ${b.last_name}`,
                `${b.pnr || 'PENDING'}`,
                `${b.passport_number || 'N/A'}`,
                b.passenger_email || 'N/A'
            ]);
        }
        tableBody.push([
            `Age: ${getAge(b.date_of_birth)}`,
            `TXN ID: ${b.booking_id}`,
            `Passport Exp: ${b.passport_expiry_date || 'N/A'}`,
            `Phone: ${b.passenger_phone || 'N/A'}`
        ]);
    });

    ensureSpace(40); // Initial space for table header and first row

    autoTable(doc, {
        startY: currentY,
        head: tableHeader,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 10, halign: 'center' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: includePrice ? {
            0: { cellWidth: 10 },
            5: { cellWidth: 35 }
        } : {
            0: { cellWidth: 10 }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.row.index % 2 !== 0) {
                data.cell.styles.fontSize = 7;
                data.cell.styles.textColor = [100, 116, 139];
                data.cell.styles.fontStyle = 'italic';
            }
        }
    });

    // --- Footer Summary ---
    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    if (includePrice) {
        ensureSpace(30);
        const tableFinalY = currentY;
        
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(130, tableFinalY, 195, tableFinalY);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Subtotal:', 160, tableFinalY + 10, { align: 'right' });
        
        const totalPrice = bookings.reduce((sum, b) => sum + Number(b.charged_price || b.flight_details.price), 0);
        doc.setTextColor(15, 23, 42);
        doc.text(formatCurrency(totalPrice), 195, tableFinalY + 10, { align: 'right' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PAID:', 160, tableFinalY + 22, { align: 'right' });
        doc.setTextColor(37, 99, 235);
        doc.text(formatCurrency(totalPrice), 195, tableFinalY + 22, { align: 'right' });
    }

    // Important Notice
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Travel Safely with TRIP N ROLL TRAVEL', 105, 275, { align: 'center' });
    
    doc.setFontSize(7);
    doc.text('This computer-generated document is a valid electronic ticket. Please present a printed copy or electronic version along with a valid ID at check-in.', 105, 282, { align: 'center' });

    doc.save(`Ticket_${firstBooking.booking_group || firstBooking.booking_id}.pdf`);
};
