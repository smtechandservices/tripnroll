import AIRLINE_MAP from './airlines.json';

export const PREDEFINED_AIRLINES = Object.keys(AIRLINE_MAP).sort();

export function getAirlineLogo(airlineName: string): string | null {
    const upperName = airlineName?.toUpperCase().trim() || '';
    
    for (const [key, code] of Object.entries(AIRLINE_MAP)) {
        if (upperName.includes(key)) {
            return `https://pics.avs.io/200/200/${code}.png`;
        }
    }
    
    return null;
}
