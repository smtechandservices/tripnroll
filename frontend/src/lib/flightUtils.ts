// Helper function to check if a flight is international
// Based on common Indian airport codes (domestic) vs international codes

const INDIAN_AIRPORT_CODES = [
    'DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'AMD', 'COK', 'PNQ', 'GOI',
    'JAI', 'LKO', 'TRV', 'VNS', 'IXC', 'ATQ', 'BBI', 'CJB', 'IXB', 'IXE',
    'IXJ', 'IXL', 'IXM', 'IXR', 'IXU', 'IXW', 'IXZ', 'JDH', 'JLR', 'JSA',
    'KNU', 'NAG', 'PAT', 'RPR', 'SHL', 'STV', 'SXR', 'TRZ', 'UDR', 'VGA'
];

export function isInternationalFlight(origin: string, destination: string): boolean {
    const originIsIndian = INDIAN_AIRPORT_CODES.includes(origin.toUpperCase());
    const destinationIsIndian = INDIAN_AIRPORT_CODES.includes(destination.toUpperCase());

    // If one is Indian and the other is not, it's international
    return originIsIndian !== destinationIsIndian;
}
