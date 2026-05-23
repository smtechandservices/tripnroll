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

export interface AirlineBranding {
    primaryColor: [number, number, number];
    accentColor: [number, number, number];
    headerTextColor: [number, number, number];
    tagline: string;
}

const DEFAULT_BRANDING: AirlineBranding = {
    primaryColor: [30, 41, 59],
    accentColor: [37, 99, 235],
    headerTextColor: [255, 255, 255],
    tagline: 'Your Journey, Our Commitment',
};

const AIRLINE_BRANDING: Record<string, AirlineBranding> = {
    SPICEJET:          { primaryColor: [214, 40, 40],   accentColor: [255, 193, 7],  headerTextColor: [255, 255, 255], tagline: 'Red. Hot. Spicy.' },
    INDIGO:            { primaryColor: [26, 31, 113],   accentColor: [0, 174, 239],  headerTextColor: [255, 255, 255], tagline: 'On Time, Every Time' },
    'AIR INDIA':       { primaryColor: [166, 24, 24],   accentColor: [255, 153, 0],  headerTextColor: [255, 255, 255], tagline: 'The Maharaja Way' },
    VISTARA:           { primaryColor: [106, 33, 168],  accentColor: [218, 165, 32], headerTextColor: [255, 255, 255], tagline: 'Fly The New Feeling' },
    'AKASA AIR':       { primaryColor: [251, 113, 0],   accentColor: [253, 224, 71], headerTextColor: [255, 255, 255], tagline: 'A Kinder Way To Fly' },
    'GO FIRST':        { primaryColor: [29, 78, 216],   accentColor: [251, 191, 36], headerTextColor: [255, 255, 255], tagline: 'Fly Smart' },
    EMIRATES:          { primaryColor: [196, 30, 58],   accentColor: [200, 160, 70], headerTextColor: [255, 255, 255], tagline: 'Fly Better' },
    QATAR:             { primaryColor: [92, 6, 50],     accentColor: [170, 130, 90], headerTextColor: [255, 255, 255], tagline: 'Going Places Together' },
    ETIHAD:            { primaryColor: [10, 10, 10],    accentColor: [168, 135, 85], headerTextColor: [255, 255, 255], tagline: 'Choose Well' },
    LUFTHANSA:         { primaryColor: [13, 45, 114],   accentColor: [255, 204, 0],  headerTextColor: [255, 255, 255], tagline: 'Say Yes To The World' },
    'AIR FRANCE':      { primaryColor: [0, 33, 87],     accentColor: [205, 0, 16],   headerTextColor: [255, 255, 255], tagline: 'France Is In The Air' },
    'BRITISH AIRWAYS': { primaryColor: [0, 0, 120],     accentColor: [190, 0, 0],    headerTextColor: [255, 255, 255], tagline: 'To Fly. To Serve.' },
    KLM:               { primaryColor: [0, 161, 222],   accentColor: [0, 100, 160],  headerTextColor: [255, 255, 255], tagline: 'The Reliable Airline' },
    'SINGAPORE AIRLINES': { primaryColor: [14, 57, 112], accentColor: [198, 148, 53], headerTextColor: [255, 255, 255], tagline: 'A Great Way To Fly' },
    'TURKISH AIRLINES':{ primaryColor: [196, 18, 48],   accentColor: [30, 30, 30],   headerTextColor: [255, 255, 255], tagline: 'Globally Yours' },
    UNITED:            { primaryColor: [0, 48, 135],    accentColor: [0, 102, 204],  headerTextColor: [255, 255, 255], tagline: 'Good Leads The Way' },
    AMERICAN:          { primaryColor: [0, 70, 127],    accentColor: [199, 32, 44],  headerTextColor: [255, 255, 255], tagline: 'A New American Feel' },
    DELTA:             { primaryColor: [0, 51, 102],    accentColor: [226, 35, 26],  headerTextColor: [255, 255, 255], tagline: 'Keep Climbing' },
    'AIR ARABIA':      { primaryColor: [212, 23, 26],   accentColor: [0, 0, 0],      headerTextColor: [255, 255, 255], tagline: 'Value For Money' },
    FLYDUBAI:          { primaryColor: [220, 40, 40],   accentColor: [255, 255, 255], headerTextColor: [255, 255, 255], tagline: 'Open Up Your World' },
    SAUDIA:            { primaryColor: [0, 100, 60],    accentColor: [200, 160, 30], headerTextColor: [255, 255, 255], tagline: 'Your Wings To The World' },
};

export function getAirlineBranding(airlineName: string): AirlineBranding {
    const upper = airlineName?.toUpperCase().trim() || '';
    for (const [key, branding] of Object.entries(AIRLINE_BRANDING)) {
        if (upper.includes(key)) return branding;
    }
    return DEFAULT_BRANDING;
}
