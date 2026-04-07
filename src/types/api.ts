export interface User {
  id: string;
  name?: string;
  email: string;
  birthDate?: string;
  birthTime?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  coins?: number;
  lastClaimedAt?: string;
  aiPersona?: string;
}

export interface LocationSearchResult {
  complete_name: string;
  latitude: number;
  longitude: number;
}

export interface PlanetData {
  name: string;
  isRetro: string;
  fullDegree: number;
  normDegree: number;
  current_sign: number;
  sign_number?: number; // Add this line
  house_number?: number;
  degrees?: number;
  minutes?: number;
  seconds?: number;
  localized_name?: string;
  nakshatra_name?: string;
  nakshatra_pada?: number;
  nakshatra_number?: number;
  zodiac_sign_lord?: string;
  zodiac_sign_name?: string;
  nakshatra_vimsottari_lord?: string;
}

export interface PanchangData {
  tithi: { name: string };
  nakshatra: { name: string };
  yoga: { name: string };
  karana: { name: string };
  weekday: { vedic_weekday_name: string };
  sun_rise: string;
  sun_set: string;
}

export interface ChartData {
  [key: string]: PlanetData;
}

export interface DashaInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  major_dasha: string;
  minor_dasha: string;
  sub_minor_dasha: string;
  sub_sub_minor_dasha: string;
  sub_sub_sub_minor_dasha: string;
}

export interface MahaDasha {
  dasha: string;
  start_date: string;
  end_date: string;
  antar_dashas: AntarDasha[];
}

export interface TransitPlanet {
  fullDegree: number;
  normDegree: number;
  isRetro: string;
  planet: {
    en: string;
  };
  zodiac_sign: {
    number: number;
    name: {
      en: string;
    };
  };
}

export interface TransitData {
  [key: string]: TransitPlanet;
}

export interface AntarDasha {
  dasha: string;
  start_date: string;
  end_date: string;
}

export interface YoginiDasha {
  name: string;
  planet: string;
  startDate: string;
  endDate: string;
  isBalance?: boolean;
  antardashas: YoginiAntardasha[];
}

export interface YoginiAntardasha {
  name: string;
  planet: string;
  startDate: string;
  endDate: string;
}

export interface PlanetDetail {
  name: string;
  details: any; // This can be more specific if needed
  houses?: string;
}

export interface SummaryResponse {
  userId: string;
  birthDetails: {
    date?: string;
    time?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  natal: ChartData;
  navamsa: ChartData;
  vimsottari: {
    activeMahaDasha: MahaDasha | null;
    activeAntarDasha: AntarDasha | null;
  };
  yogini: {
    activeYogini: YoginiDasha | null;
    activeYoginiAntar: YoginiAntardasha | null;
  };
  transit: ChartData;
  specialPlanets: {
    atmakaraka: PlanetDetail;
    darakaraka: PlanetDetail;
    yogakaraka: PlanetDetail | null;
  };
}
