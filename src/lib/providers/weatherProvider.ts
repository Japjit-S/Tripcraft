import { DayForecast, Destination } from '../types/engine';
import {
  addDaysToDate,
  getDaysDifference,
  shiftYear,
} from '../engine/timezone';

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

const USER_AGENT = 'Tripcraft/1.0 (travel-planner-app)';
const MAX_FORECAST_HORIZON_DAYS = 16;
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface WeatherCacheEntry {
  timestamp: number;
  data: DayForecast[];
}

interface OpenMeteoDailyData {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  wind_speed_10m_max?: number[];
  precipitation_sum?: number[];
}

export interface RawGeocodingItem {
  id: number;
  name: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
  feature_code?: string;
}

function normalizeSearchText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CANONICAL_INDIAN_DESTINATIONS: Record<string, Destination> = {
  // Dharamshala / Dharamsala / McLeod Ganj
  dharmshala: {
    id: 'openmeteo:1272832',
    city: 'Dharamshala',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2201,
    longitude: 76.3201,
    timezone: 'Asia/Kolkata',
  },
  dharamshala: {
    id: 'openmeteo:1272832',
    city: 'Dharamshala',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2201,
    longitude: 76.3201,
    timezone: 'Asia/Kolkata',
  },
  dharamsala: {
    id: 'openmeteo:1272832',
    city: 'Dharamshala',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2201,
    longitude: 76.3201,
    timezone: 'Asia/Kolkata',
  },
  mcleodganj: {
    id: 'openmeteo:1272832',
    city: 'McLeod Ganj (Dharamshala)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2426,
    longitude: 76.3213,
    timezone: 'Asia/Kolkata',
  },
  'mcleod ganj': {
    id: 'openmeteo:1272832',
    city: 'McLeod Ganj (Dharamshala)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2426,
    longitude: 76.3213,
    timezone: 'Asia/Kolkata',
  },

  // Goa & Goan Hubs
  goa: {
    id: 'openmeteo:1260607',
    city: 'Goa',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.49574,
    longitude: 73.82624,
    timezone: 'Asia/Kolkata',
  },
  panaji: {
    id: 'openmeteo:1260607',
    city: 'Panaji',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.49574,
    longitude: 73.82624,
    timezone: 'Asia/Kolkata',
  },
  panjim: {
    id: 'openmeteo:1260607',
    city: 'Panaji',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.49574,
    longitude: 73.82624,
    timezone: 'Asia/Kolkata',
  },
  calangute: {
    id: 'openmeteo:1273935',
    city: 'Calangute',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.5394,
    longitude: 73.7554,
    timezone: 'Asia/Kolkata',
  },
  candolim: {
    id: 'openmeteo:1273857',
    city: 'Candolim',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.5178,
    longitude: 73.7634,
    timezone: 'Asia/Kolkata',
  },
  baga: {
    id: 'openmeteo:1277648',
    city: 'Baga',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.5553,
    longitude: 73.7516,
    timezone: 'Asia/Kolkata',
  },
  anjuna: {
    id: 'openmeteo:1278486',
    city: 'Anjuna',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.5836,
    longitude: 73.7431,
    timezone: 'Asia/Kolkata',
  },
  margao: {
    id: 'openmeteo:1263704',
    city: 'Margao',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.2736,
    longitude: 73.9582,
    timezone: 'Asia/Kolkata',
  },
  madgaon: {
    id: 'openmeteo:1263704',
    city: 'Margao',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Goa',
    latitude: 15.2736,
    longitude: 73.9582,
    timezone: 'Asia/Kolkata',
  },

  // Coorg & Karnataka
  coorg: {
    id: 'openmeteo:1264540',
    city: 'Coorg (Madikeri)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.426,
    longitude: 75.7382,
    timezone: 'Asia/Kolkata',
  },
  kodagu: {
    id: 'openmeteo:1264540',
    city: 'Coorg (Madikeri)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.426,
    longitude: 75.7382,
    timezone: 'Asia/Kolkata',
  },
  madikeri: {
    id: 'openmeteo:1264540',
    city: 'Madikeri (Coorg)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.426,
    longitude: 75.7382,
    timezone: 'Asia/Kolkata',
  },
  bangalore: {
    id: 'openmeteo:1277333',
    city: 'Bengaluru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.97194,
    longitude: 77.59369,
    timezone: 'Asia/Kolkata',
  },
  bengaluru: {
    id: 'openmeteo:1277333',
    city: 'Bengaluru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.97194,
    longitude: 77.59369,
    timezone: 'Asia/Kolkata',
  },
  hampi: {
    id: 'openmeteo:1269934',
    city: 'Hampi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 15.335,
    longitude: 76.46,
    timezone: 'Asia/Kolkata',
  },
  gokarna: {
    id: 'openmeteo:1270889',
    city: 'Gokarna',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 14.5479,
    longitude: 74.3188,
    timezone: 'Asia/Kolkata',
  },
  mysore: {
    id: 'openmeteo:1262321',
    city: 'Mysuru (Mysore)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
    timezone: 'Asia/Kolkata',
  },
  mysuru: {
    id: 'openmeteo:1262321',
    city: 'Mysuru',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
    timezone: 'Asia/Kolkata',
  },
  chikmagalur: {
    id: 'openmeteo:1274483',
    city: 'Chikmagalur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 13.3161,
    longitude: 75.772,
    timezone: 'Asia/Kolkata',
  },
  chikkamagaluru: {
    id: 'openmeteo:1274483',
    city: 'Chikmagalur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Karnataka',
    latitude: 13.3161,
    longitude: 75.772,
    timezone: 'Asia/Kolkata',
  },

  // Himachal Pradesh
  manali: {
    id: 'openmeteo:1263967',
    city: 'Manali',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2574,
    longitude: 77.1748,
    timezone: 'Asia/Kolkata',
  },
  shimla: {
    id: 'openmeteo:1256215',
    city: 'Shimla',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 31.1048,
    longitude: 77.1734,
    timezone: 'Asia/Kolkata',
  },
  simla: {
    id: 'openmeteo:1256215',
    city: 'Shimla',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 31.1048,
    longitude: 77.1734,
    timezone: 'Asia/Kolkata',
  },
  kasol: {
    id: 'openmeteo:1267561',
    city: 'Kasol',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.0099,
    longitude: 77.3142,
    timezone: 'Asia/Kolkata',
  },
  spiti: {
    id: 'openmeteo:12076709',
    city: 'Kaza (Spiti Valley)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2328,
    longitude: 78.0667,
    timezone: 'Asia/Kolkata',
  },
  'spiti valley': {
    id: 'openmeteo:12076709',
    city: 'Kaza (Spiti Valley)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2328,
    longitude: 78.0667,
    timezone: 'Asia/Kolkata',
  },
  kaza: {
    id: 'openmeteo:12076709',
    city: 'Kaza (Spiti Valley)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2328,
    longitude: 78.0667,
    timezone: 'Asia/Kolkata',
  },
  dalhousie: {
    id: 'openmeteo:1273574',
    city: 'Dalhousie',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.5387,
    longitude: 75.971,
    timezone: 'Asia/Kolkata',
  },
  kasauli: {
    id: 'openmeteo:1267576',
    city: 'Kasauli',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 30.9013,
    longitude: 76.9649,
    timezone: 'Asia/Kolkata',
  },
  bir: {
    id: 'openmeteo:1275618',
    city: 'Bir Billing',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.0469,
    longitude: 76.718,
    timezone: 'Asia/Kolkata',
  },
  'bir billing': {
    id: 'openmeteo:1275618',
    city: 'Bir Billing',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.0469,
    longitude: 76.718,
    timezone: 'Asia/Kolkata',
  },

  // Uttarakhand
  rishikesh: {
    id: 'openmeteo:1258128',
    city: 'Rishikesh',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 30.1078,
    longitude: 78.2926,
    timezone: 'Asia/Kolkata',
  },
  hrishikesh: {
    id: 'openmeteo:1258128',
    city: 'Rishikesh',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 30.1078,
    longitude: 78.2926,
    timezone: 'Asia/Kolkata',
  },
  haridwar: {
    id: 'openmeteo:1270425',
    city: 'Haridwar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 29.9457,
    longitude: 78.1642,
    timezone: 'Asia/Kolkata',
  },
  hardwar: {
    id: 'openmeteo:1270425',
    city: 'Haridwar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 29.9457,
    longitude: 78.1642,
    timezone: 'Asia/Kolkata',
  },
  mussoorie: {
    id: 'openmeteo:1262423',
    city: 'Mussoorie',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 30.4598,
    longitude: 78.0644,
    timezone: 'Asia/Kolkata',
  },
  mussorie: {
    id: 'openmeteo:1262423',
    city: 'Mussoorie',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 30.4598,
    longitude: 78.0644,
    timezone: 'Asia/Kolkata',
  },
  nainital: {
    id: 'openmeteo:1262180',
    city: 'Nainital',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 29.3919,
    longitude: 79.4542,
    timezone: 'Asia/Kolkata',
  },
  dehradun: {
    id: 'openmeteo:1273313',
    city: 'Dehradun',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 30.3165,
    longitude: 78.0322,
    timezone: 'Asia/Kolkata',
  },
  corbett: {
    id: 'openmeteo:1258661',
    city: 'Jim Corbett (Ramnagar)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 29.3956,
    longitude: 79.1264,
    timezone: 'Asia/Kolkata',
  },
  'jim corbett': {
    id: 'openmeteo:1258661',
    city: 'Jim Corbett (Ramnagar)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttarakhand',
    latitude: 29.3956,
    longitude: 79.1264,
    timezone: 'Asia/Kolkata',
  },

  // Ladakh & Jammu/Kashmir
  leh: {
    id: 'openmeteo:1264976',
    city: 'Leh',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Ladakh',
    latitude: 34.1650,
    longitude: 77.5840,
    timezone: 'Asia/Kolkata',
  },
  ladakh: {
    id: 'openmeteo:1264976',
    city: 'Leh (Ladakh)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Ladakh',
    latitude: 34.1650,
    longitude: 77.5840,
    timezone: 'Asia/Kolkata',
  },
  srinagar: {
    id: 'openmeteo:1255634',
    city: 'Srinagar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Jammu and Kashmir',
    latitude: 34.0837,
    longitude: 74.7973,
    timezone: 'Asia/Kolkata',
  },
  gulmarg: {
    id: 'openmeteo:1270743',
    city: 'Gulmarg',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Jammu and Kashmir',
    latitude: 34.0536,
    longitude: 74.3819,
    timezone: 'Asia/Kolkata',
  },
  pahalgam: {
    id: 'openmeteo:1260840',
    city: 'Pahalgam',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Jammu and Kashmir',
    latitude: 34.0125,
    longitude: 75.1889,
    timezone: 'Asia/Kolkata',
  },

  // Kerala
  munnar: {
    id: 'openmeteo:1262744',
    city: 'Munnar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 10.0889,
    longitude: 77.0595,
    timezone: 'Asia/Kolkata',
  },
  alleppey: {
    id: 'openmeteo:1278916',
    city: 'Alleppey (Alappuzha)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 9.4981,
    longitude: 76.3388,
    timezone: 'Asia/Kolkata',
  },
  alappuzha: {
    id: 'openmeteo:1278916',
    city: 'Alappuzha',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 9.4981,
    longitude: 76.3388,
    timezone: 'Asia/Kolkata',
  },
  kochi: {
    id: 'openmeteo:1273874',
    city: 'Kochi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 9.93988,
    longitude: 76.26022,
    timezone: 'Asia/Kolkata',
  },
  cochin: {
    id: 'openmeteo:1273874',
    city: 'Kochi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 9.93988,
    longitude: 76.26022,
    timezone: 'Asia/Kolkata',
  },
  wayanad: {
    id: 'openmeteo:1268307',
    city: 'Wayanad (Kalpetta)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 11.608,
    longitude: 76.082,
    timezone: 'Asia/Kolkata',
  },
  varkala: {
    id: 'openmeteo:1253347',
    city: 'Varkala',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 8.7379,
    longitude: 76.7163,
    timezone: 'Asia/Kolkata',
  },
  kovalam: {
    id: 'openmeteo:1266854',
    city: 'Kovalam',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 8.402,
    longitude: 76.9784,
    timezone: 'Asia/Kolkata',
  },
  trivandrum: {
    id: 'openmeteo:1254163',
    city: 'Thiruvananthapuram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 8.5241,
    longitude: 76.9366,
    timezone: 'Asia/Kolkata',
  },
  thiruvananthapuram: {
    id: 'openmeteo:1254163',
    city: 'Thiruvananthapuram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Kerala',
    latitude: 8.5241,
    longitude: 76.9366,
    timezone: 'Asia/Kolkata',
  },

  // Tamil Nadu & Pondicherry
  ooty: {
    id: 'openmeteo:1254674',
    city: 'Ooty (Udhagamandalam)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 11.4102,
    longitude: 76.695,
    timezone: 'Asia/Kolkata',
  },
  udhagamandalam: {
    id: 'openmeteo:1254674',
    city: 'Ooty (Udhagamandalam)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 11.4102,
    longitude: 76.695,
    timezone: 'Asia/Kolkata',
  },
  kodaikanal: {
    id: 'openmeteo:1266946',
    city: 'Kodaikanal',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 10.2381,
    longitude: 77.4892,
    timezone: 'Asia/Kolkata',
  },
  chennai: {
    id: 'openmeteo:1264527',
    city: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 13.08784,
    longitude: 80.27847,
    timezone: 'Asia/Kolkata',
  },
  madras: {
    id: 'openmeteo:1264527',
    city: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 13.08784,
    longitude: 80.27847,
    timezone: 'Asia/Kolkata',
  },
  pondicherry: {
    id: 'openmeteo:1259425',
    city: 'Puducherry (Pondicherry)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Puducherry',
    latitude: 11.93381,
    longitude: 79.82979,
    timezone: 'Asia/Kolkata',
  },
  puducherry: {
    id: 'openmeteo:1259425',
    city: 'Puducherry',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Puducherry',
    latitude: 11.93381,
    longitude: 79.82979,
    timezone: 'Asia/Kolkata',
  },
  rameswaram: {
    id: 'openmeteo:1258528',
    city: 'Rameswaram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 9.2876,
    longitude: 79.3129,
    timezone: 'Asia/Kolkata',
  },
  rameshwaram: {
    id: 'openmeteo:1258528',
    city: 'Rameswaram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 9.2876,
    longitude: 79.3129,
    timezone: 'Asia/Kolkata',
  },
  kanyakumari: {
    id: 'openmeteo:1267995',
    city: 'Kanyakumari',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 8.0883,
    longitude: 77.5385,
    timezone: 'Asia/Kolkata',
  },
  madurai: {
    id: 'openmeteo:1264503',
    city: 'Madurai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 9.9252,
    longitude: 78.1198,
    timezone: 'Asia/Kolkata',
  },
  mahabalipuram: {
    id: 'openmeteo:1264516',
    city: 'Mahabalipuram',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Tamil Nadu',
    latitude: 12.6269,
    longitude: 80.1927,
    timezone: 'Asia/Kolkata',
  },

  // Andaman
  andaman: {
    id: 'openmeteo:1259385',
    city: 'Port Blair (Andaman)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Andaman and Nicobar',
    latitude: 11.6667,
    longitude: 92.75,
    timezone: 'Asia/Kolkata',
  },
  'port blair': {
    id: 'openmeteo:1259385',
    city: 'Port Blair',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Andaman and Nicobar',
    latitude: 11.6667,
    longitude: 92.75,
    timezone: 'Asia/Kolkata',
  },
  havelock: {
    id: 'openmeteo:1259385',
    city: 'Havelock Island (Andaman)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Andaman and Nicobar',
    latitude: 12.0333,
    longitude: 92.9833,
    timezone: 'Asia/Kolkata',
  },

  // Rajasthan
  jaipur: {
    id: 'openmeteo:1269515',
    city: 'Jaipur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
  },
  udaipur: {
    id: 'openmeteo:1253991',
    city: 'Udaipur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 24.5854,
    longitude: 73.7125,
    timezone: 'Asia/Kolkata',
  },
  jodhpur: {
    id: 'openmeteo:1268865',
    city: 'Jodhpur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 26.2389,
    longitude: 73.0243,
    timezone: 'Asia/Kolkata',
  },
  jaisalmer: {
    id: 'openmeteo:1269507',
    city: 'Jaisalmer',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 26.9157,
    longitude: 70.9083,
    timezone: 'Asia/Kolkata',
  },
  pushkar: {
    id: 'openmeteo:1259274',
    city: 'Pushkar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 26.4897,
    longitude: 74.5511,
    timezone: 'Asia/Kolkata',
  },
  'mount abu': {
    id: 'openmeteo:1262708',
    city: 'Mount Abu',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 24.5925,
    longitude: 72.7156,
    timezone: 'Asia/Kolkata',
  },

  // Major Metros & Historic Hubs
  delhi: {
    id: 'openmeteo:1273294',
    city: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.65195,
    longitude: 77.23149,
    timezone: 'Asia/Kolkata',
  },
  'new delhi': {
    id: 'openmeteo:1261481',
    city: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  mumbai: {
    id: 'openmeteo:1275339',
    city: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.07283,
    longitude: 72.88261,
    timezone: 'Asia/Kolkata',
  },
  bombay: {
    id: 'openmeteo:1275339',
    city: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.07283,
    longitude: 72.88261,
    timezone: 'Asia/Kolkata',
  },
  kolkata: {
    id: 'openmeteo:1275004',
    city: 'Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 22.56263,
    longitude: 88.36304,
    timezone: 'Asia/Kolkata',
  },
  calcutta: {
    id: 'openmeteo:1275004',
    city: 'Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 22.56263,
    longitude: 88.36304,
    timezone: 'Asia/Kolkata',
  },
  varanasi: {
    id: 'openmeteo:1253405',
    city: 'Varanasi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
  },
  banaras: {
    id: 'openmeteo:1253405',
    city: 'Varanasi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
  },
  benares: {
    id: 'openmeteo:1253405',
    city: 'Varanasi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
  },
  kashi: {
    id: 'openmeteo:1253405',
    city: 'Varanasi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
  },
  agra: {
    id: 'openmeteo:1279259',
    city: 'Agra',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 27.18793,
    longitude: 78.01633,
    timezone: 'Asia/Kolkata',
  },
  amritsar: {
    id: 'openmeteo:1278710',
    city: 'Amritsar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Punjab',
    latitude: 31.634,
    longitude: 74.8723,
    timezone: 'Asia/Kolkata',
  },
  hyderabad: {
    id: 'openmeteo:1269843',
    city: 'Hyderabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
  },
  pune: {
    id: 'openmeteo:1259229',
    city: 'Pune',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
  },
  poona: {
    id: 'openmeteo:1259229',
    city: 'Pune',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
  },
  ahmedabad: {
    id: 'openmeteo:1279233',
    city: 'Ahmedabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    timezone: 'Asia/Kolkata',
  },
  chandigarh: {
    id: 'openmeteo:1274746',
    city: 'Chandigarh',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Chandigarh',
    latitude: 30.7333,
    longitude: 76.7794,
    timezone: 'Asia/Kolkata',
  },
  lucknow: {
    id: 'openmeteo:1264733',
    city: 'Lucknow',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    timezone: 'Asia/Kolkata',
  },
  darjeeling: {
    id: 'openmeteo:1273516',
    city: 'Darjeeling',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 27.041,
    longitude: 88.2663,
    timezone: 'Asia/Kolkata',
  },
  darjiling: {
    id: 'openmeteo:1273516',
    city: 'Darjeeling',
    country: 'India',
    countryCode: 'IN',
    admin1: 'West Bengal',
    latitude: 27.041,
    longitude: 88.2663,
    timezone: 'Asia/Kolkata',
  },
  gangtok: {
    id: 'openmeteo:1270830',
    city: 'Gangtok',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Sikkim',
    latitude: 27.3389,
    longitude: 88.6065,
    timezone: 'Asia/Kolkata',
  },
  shillong: {
    id: 'openmeteo:1256523',
    city: 'Shillong',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Meghalaya',
    latitude: 25.5788,
    longitude: 91.8933,
    timezone: 'Asia/Kolkata',
  },
  cherrapunji: {
    id: 'openmeteo:1274553',
    city: 'Cherrapunji (Sohra)',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Meghalaya',
    latitude: 25.2744,
    longitude: 91.7323,
    timezone: 'Asia/Kolkata',
  },
  puri: {
    id: 'openmeteo:1259243',
    city: 'Puri',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Odisha',
    latitude: 19.8135,
    longitude: 85.8312,
    timezone: 'Asia/Kolkata',
  },
  bhubaneswar: {
    id: 'openmeteo:1275817',
    city: 'Bhubaneswar',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
    timezone: 'Asia/Kolkata',
  },
  khajuraho: {
    id: 'openmeteo:1267232',
    city: 'Khajuraho',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Madhya Pradesh',
    latitude: 24.8318,
    longitude: 79.9199,
    timezone: 'Asia/Kolkata',
  },
  ayodhya: {
    id: 'openmeteo:1278216',
    city: 'Ayodhya',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Uttar Pradesh',
    latitude: 26.7922,
    longitude: 82.1998,
    timezone: 'Asia/Kolkata',
  },
  tirupati: {
    id: 'openmeteo:1254216',
    city: 'Tirupati',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Andhra Pradesh',
    latitude: 13.6288,
    longitude: 79.4192,
    timezone: 'Asia/Kolkata',
  },
};

const REGION_SUGGESTIONS: Record<string, string[]> = {
  kashmir: ['srinagar', 'gulmarg', 'pahalgam'],
  kerala: ['kochi', 'munnar', 'alleppey', 'thiruvananthapuram', 'wayanad'],
  rajasthan: ['jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'pushkar'],
  himachal: ['shimla', 'manali', 'dharmshala', 'kasol', 'spiti'],
  'himachal pradesh': ['shimla', 'manali', 'dharmshala', 'kasol', 'spiti'],
  uttarakhand: ['rishikesh', 'nainital', 'mussoorie', 'haridwar', 'dehradun'],
  goa: ['goa', 'panaji', 'calangute', 'margao', 'baga'],
  ladakh: ['leh'],
  andaman: ['andaman', 'port blair', 'havelock'],
  sikkim: ['gangtok'],
  meghalaya: ['shillong', 'cherrapunji'],
};

const QUERY_ALIASES: Record<string, string> = {
  dharmshala: 'Dharamsala',
  dharamshala: 'Dharamsala',
  mcleodganj: 'Dharamsala',
  'mcleod ganj': 'Dharamsala',
  goa: 'Panaji',
  coorg: 'Madikeri',
  kodagu: 'Madikeri',
  spiti: 'Kaza',
  'spiti valley': 'Kaza',
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  cochin: 'Kochi',
  trivandrum: 'Thiruvananthapuram',
  poona: 'Pune',
  banaras: 'Varanasi',
  benares: 'Varanasi',
  kashi: 'Varanasi',
  pondicherry: 'Puducherry',
  ooty: 'Udhagamandalam',
  alleppey: 'Alappuzha',
  leh: 'Leh',
  ladakh: 'Leh',
  andaman: 'Port Blair',
  simla: 'Shimla',
  hrishikesh: 'Rishikesh',
  hardwar: 'Haridwar',
  mussorie: 'Mussoorie',
  darjiling: 'Darjeeling',
  mysore: 'Mysuru',
  chikkamagaluru: 'Chikmagalur',
  kashmir: 'Srinagar',
};

const MAJOR_CITY_STATES: Record<string, string> = {
  jaipur: 'rajasthan',
  jodhpur: 'rajasthan',
  udaipur: 'rajasthan',
  jaisalmer: 'rajasthan',
  pushkar: 'rajasthan',
  'mount abu': 'rajasthan',
  bikaner: 'rajasthan',
  delhi: 'delhi',
  'new delhi': 'delhi',
  mumbai: 'maharashtra',
  bombay: 'maharashtra',
  pune: 'maharashtra',
  poona: 'maharashtra',
  nagpur: 'maharashtra',
  bengaluru: 'karnataka',
  bangalore: 'karnataka',
  mysuru: 'karnataka',
  mysore: 'karnataka',
  hampi: 'karnataka',
  gokarna: 'karnataka',
  coorg: 'karnataka',
  madikeri: 'karnataka',
  kodagu: 'karnataka',
  chikmagalur: 'karnataka',
  chikkamagaluru: 'karnataka',
  kolkata: 'west bengal',
  calcutta: 'west bengal',
  darjeeling: 'west bengal',
  darjiling: 'west bengal',
  chennai: 'tamil nadu',
  madras: 'tamil nadu',
  ooty: 'tamil nadu',
  udhagamandalam: 'tamil nadu',
  kodaikanal: 'tamil nadu',
  madurai: 'tamil nadu',
  rameswaram: 'tamil nadu',
  rameshwaram: 'tamil nadu',
  kanyakumari: 'tamil nadu',
  mahabalipuram: 'tamil nadu',
  coimbatore: 'tamil nadu',
  hyderabad: 'telangana',
  ahmedabad: 'gujarat',
  surat: 'gujarat',
  vadodara: 'gujarat',
  lucknow: 'uttar pradesh',
  varanasi: 'uttar pradesh',
  banaras: 'uttar pradesh',
  benares: 'uttar pradesh',
  kashi: 'uttar pradesh',
  agra: 'uttar pradesh',
  kanpur: 'uttar pradesh',
  ayodhya: 'uttar pradesh',
  mathura: 'uttar pradesh',
  vrindavan: 'uttar pradesh',
  amritsar: 'punjab',
  chandigarh: 'chandigarh',
  bhopal: 'madhya pradesh',
  indore: 'madhya pradesh',
  gwalior: 'madhya pradesh',
  khajuraho: 'madhya pradesh',
  patna: 'bihar',
  bhubaneswar: 'odisha',
  puri: 'odisha',
  kochi: 'kerala',
  cochin: 'kerala',
  munnar: 'kerala',
  alleppey: 'kerala',
  alappuzha: 'kerala',
  thiruvananthapuram: 'kerala',
  trivandrum: 'kerala',
  wayanad: 'kerala',
  varkala: 'kerala',
  kovalam: 'kerala',
  shimla: 'himachal pradesh',
  simla: 'himachal pradesh',
  manali: 'himachal pradesh',
  dharmshala: 'himachal pradesh',
  dharamshala: 'himachal pradesh',
  dharamsala: 'himachal pradesh',
  mcleodganj: 'himachal pradesh',
  'mcleod ganj': 'himachal pradesh',
  kasol: 'himachal pradesh',
  spiti: 'himachal pradesh',
  'spiti valley': 'himachal pradesh',
  kaza: 'himachal pradesh',
  dalhousie: 'himachal pradesh',
  kasauli: 'himachal pradesh',
  bir: 'himachal pradesh',
  'bir billing': 'himachal pradesh',
  dehradun: 'uttarakhand',
  rishikesh: 'uttarakhand',
  hrishikesh: 'uttarakhand',
  haridwar: 'uttarakhand',
  hardwar: 'uttarakhand',
  mussoorie: 'uttarakhand',
  mussorie: 'uttarakhand',
  nainital: 'uttarakhand',
  corbett: 'uttarakhand',
  'jim corbett': 'uttarakhand',
  srinagar: 'jammu and kashmir',
  gulmarg: 'jammu and kashmir',
  pahalgam: 'jammu and kashmir',
  leh: 'ladakh',
  ladakh: 'ladakh',
  goa: 'goa',
  panaji: 'goa',
  panjim: 'goa',
  calangute: 'goa',
  candolim: 'goa',
  baga: 'goa',
  anjuna: 'goa',
  margao: 'goa',
  madgaon: 'goa',
  gangtok: 'sikkim',
  shillong: 'meghalaya',
  cherrapunji: 'meghalaya',
  tirupati: 'andhra pradesh',
  visakhapatnam: 'andhra pradesh',
  puducherry: 'puducherry',
  pondicherry: 'puducherry',
  'port blair': 'andaman and nicobar',
  andaman: 'andaman and nicobar',
  havelock: 'andaman and nicobar',
};

function isProminentDestination(name: string, admin1: string): boolean {
  const n = normalizeSearchText(name);
  const a = normalizeSearchText(admin1);
  const expectedState = MAJOR_CITY_STATES[n];
  if (expectedState) {
    return a.includes(expectedState) || expectedState.includes(a);
  }
  return false;
}

function scoreGeocodingResult(r: RawGeocodingItem, query: string): number {
  const q = normalizeSearchText(query);
  const name = normalizeSearchText(r.name);
  const admin1 = normalizeSearchText(r.admin1 || '');
  let score = 0;

  const isFamous = isProminentDestination(name, admin1);
  const pop = Math.max(0, r.population || 0);
  const code = (r.feature_code || '').toUpperCase();

  // Administrative / Capital prominence
  if (code === 'PPLC') score += 25000; // National Capital
  else if (code === 'PPLA') score += 18000; // State Capital
  else if (code === 'PPLA2') score += 12000; // District Capital
  else if (code === 'PPLA3' || code === 'PPLA4') score += 4000;
  else if (code === 'PASS' && (name.includes('kaza') || name.includes('spiti'))) score += 15000;

  // Iconic Indian tourist hubs and premier destinations
  if (isFamous) {
    score += 40000;
  }

  // Name matching with normalized string
  if (name === q) {
    score += 20000;
  } else if (name.startsWith(q)) {
    score += 10000;
  } else if (name.includes(q)) {
    score += 4000;
  }

  // Admin1 (State/Territory) match (e.g. typing "Goa", "Rajasthan", "Kerala")
  if (admin1 === q) {
    score += 15000;
  } else if (admin1.startsWith(q)) {
    score += 6000;
  }

  // Population scaling (real cities have 50k to 15M population)
  if (pop > 0) {
    score += Math.log10(pop + 1) * 2500;
  } else if (!isFamous) {
    // Obscure rural hamlets with 0 recorded population receive a strong penalty
    // to prevent them from displacing real destinations and big cities.
    score -= 40000;
  }

  // Special high-precision disambiguations
  if ((name === 'dharamsala' || name === 'dharamshala' || name === 'dharmshala') && admin1.includes('himachal')) {
    score += 50000;
  }
  if (name === 'manali' && admin1.includes('himachal')) {
    score += 40000;
  }
  if ((name === 'goa' || name === 'panaji' || name === 'panjim') && admin1 === 'goa') {
    score += 50000;
  }

  return score;
}

export class WeatherProvider {
  private cache = new Map<string, WeatherCacheEntry>();

  /**
   * Geocodes a destination city query into a normalized Destination object.
   * Preserves destination IANA timezone and administrative disambiguation context.
   */
  async geocodeCity(
    cityQuery: string,
    context?: { admin1?: string; country?: string; countryCode?: string }
  ): Promise<Destination | null> {
    const cleaned = cityQuery.trim();
    if (!cleaned) return null;

    const lowerCleaned = normalizeSearchText(cleaned);
    const firstPart = normalizeSearchText(cleaned.split(',')[0]);

    // Fast-path canonical Indian destinations (e.g. "Goa", "Dharmshala", "Bangalore", "Coorg")
    if (CANONICAL_INDIAN_DESTINATIONS[lowerCleaned]) {
      return CANONICAL_INDIAN_DESTINATIONS[lowerCleaned];
    }
    if (CANONICAL_INDIAN_DESTINATIONS[firstPart]) {
      return CANONICAL_INDIAN_DESTINATIONS[firstPart];
    }

    // If query has comma (e.g. "Manali, Himachal Pradesh"), try full query first
    const queriesToTry = [cleaned];
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts[0] && parts[0] !== cleaned) {
        queriesToTry.push(parts[0]);
      }
    } else if (context?.admin1) {
      queriesToTry.unshift(`${cleaned}, ${context.admin1}`);
    }

    // Add query alias if present
    const alias = QUERY_ALIASES[lowerCleaned] || QUERY_ALIASES[firstPart];
    if (alias && !queriesToTry.includes(alias)) {
      queriesToTry.push(alias);
    }

    let allResults: RawGeocodingItem[] = [];

    for (const q of queriesToTry) {
      const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(q)}&count=20&language=en&format=json`;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { results?: RawGeocodingItem[] };
        if (data.results && data.results.length > 0) {
          allResults = data.results;
          break;
        }
      } catch {
        // continue to next query candidate
      }
    }

    if (allResults.length === 0) {
      return null;
    }

    // Sort results by relevance and population prominence before picking match
    allResults.sort((a, b) => scoreGeocodingResult(b, cleaned) - scoreGeocodingResult(a, cleaned));

    let matched = allResults[0];

    if (context?.admin1) {
      const targetAdmin = normalizeSearchText(context.admin1);
      const adminMatch = allResults.find(
        (r) => r.admin1 && normalizeSearchText(r.admin1) === targetAdmin
      );
      if (adminMatch) matched = adminMatch;
    } else if (context?.countryCode) {
      const targetCode = context.countryCode.toUpperCase().trim();
      const codeMatch = allResults.find(
        (r) => r.country_code && r.country_code.toUpperCase().trim() === targetCode
      );
      if (codeMatch) matched = codeMatch;
    } else if (context?.country) {
      const targetCountry = normalizeSearchText(context.country);
      const countryMatch = allResults.find(
        (r) => r.country && normalizeSearchText(r.country) === targetCountry
      );
      if (countryMatch) matched = countryMatch;
    }

    return {
      id: `openmeteo:${matched.id}`,
      city: matched.name,
      country: matched.country || '',
      countryCode: matched.country_code || '',
      admin1: matched.admin1 || '',
      latitude: matched.latitude,
      longitude: matched.longitude,
      timezone: matched.timezone || 'UTC',
    };
  }

  /**
   * Searches for matching cities matching the query with debouncing/capping.
   * Includes destination IANA timezone.
   * Restricts results to India ('IN') by default per Tripcraft destination product rule.
   * Ranks major tourist destinations and high-population cities above obscure hamlets.
   */
  async searchCities(query: string, count = 6, countryCode: string | null = 'IN'): Promise<Destination[]> {
    const cleaned = query.trim();
    if (cleaned.length < 2) return [];

    const lower = normalizeSearchText(cleaned);
    const isIndia = !countryCode || countryCode.toUpperCase().trim() === 'IN';

    // Collect query variants (e.g. alias if present)
    const queries = [cleaned];
    if (isIndia) {
      const alias = QUERY_ALIASES[lower];
      if (alias && !queries.includes(alias)) {
        queries.push(alias);
      }
    }

    const fetchedItems: RawGeocodingItem[] = [];

    // 1. Regional search expansion (e.g. "kashmir", "rajasthan", "kerala", "himachal", "goa")
    if (isIndia && REGION_SUGGESTIONS[lower]) {
      for (const destKey of REGION_SUGGESTIONS[lower]) {
        const dest = CANONICAL_INDIAN_DESTINATIONS[destKey];
        if (dest) {
          fetchedItems.push({
            id: Number(dest.id.replace('openmeteo:', '')) || 999999,
            name: dest.city,
            country: dest.country,
            country_code: dest.countryCode,
            admin1: dest.admin1,
            latitude: dest.latitude,
            longitude: dest.longitude,
            timezone: dest.timezone,
            population: 1500000,
            feature_code: 'PPLA',
          });
        }
      }
    }

    // 2. Canonical destinations injection (e.g. "dharmshala", "goa", "coorg", "manali", "ooty")
    if (isIndia) {
      for (const [key, dest] of Object.entries(CANONICAL_INDIAN_DESTINATIONS)) {
        if (key === lower || (key.startsWith(lower) && lower.length >= 3) || (lower.startsWith(key) && key.length >= 4)) {
          fetchedItems.push({
            id: Number(dest.id.replace('openmeteo:', '')) || 999999,
            name: dest.city,
            country: dest.country,
            country_code: dest.countryCode,
            admin1: dest.admin1,
            latitude: dest.latitude,
            longitude: dest.longitude,
            timezone: dest.timezone,
            population: 1500000,
            feature_code: 'PPLA2',
          });
        }
      }
    }

    // 3. Query Open-Meteo with search variants
    for (const q of queries) {
      const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(q)}&count=50&language=en&format=json`;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { results?: RawGeocodingItem[] };
        if (data.results && Array.isArray(data.results)) {
          fetchedItems.push(...data.results);
        }
      } catch {
        // continue
      }
    }

    if (fetchedItems.length === 0) {
      return [];
    }

    let filtered = fetchedItems;
    if (countryCode) {
      const target = countryCode.toUpperCase().trim();
      filtered = fetchedItems.filter(
        (r) => r.country_code && r.country_code.toUpperCase().trim() === target
      );
    }

    // 4. Deduplicate by proximity (< 15km) and normalized name
    const deduplicated: RawGeocodingItem[] = [];
    for (const item of filtered) {
      const isDup = deduplicated.some(
        (d) =>
          d.id === item.id ||
          (normalizeSearchText(d.name) === normalizeSearchText(item.name) &&
            normalizeSearchText(d.admin1 || '') === normalizeSearchText(item.admin1 || '')) ||
          (Math.abs(d.latitude - item.latitude) < 0.15 &&
            Math.abs(d.longitude - item.longitude) < 0.15 &&
            normalizeSearchText(d.name) === normalizeSearchText(item.name))
      );
      if (!isDup) {
        deduplicated.push(item);
      }
    }

    // 5. Filter out 0-population hamlets with negative scores if real destinations exist
    const hasPositiveScores = deduplicated.some((item) => scoreGeocodingResult(item, cleaned) > 0);
    const candidateList = hasPositiveScores
      ? deduplicated.filter((item) => scoreGeocodingResult(item, cleaned) > 0)
      : deduplicated;

    // 6. Sort by prominence & relevance score descending
    candidateList.sort((a, b) => scoreGeocodingResult(b, cleaned) - scoreGeocodingResult(a, cleaned));

    return candidateList.slice(0, count).map((r) => ({
      id: `openmeteo:${r.id}`,
      city: r.name,
      country: r.country || '',
      countryCode: r.country_code || '',
      admin1: r.admin1 || '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'UTC',
    }));
  }

  /**
   * Fetches weather forecast data for a destination and trip duration.
   * Stage 3 Implementation:
   * - Evaluates the 16-day forecast horizon PER DAY rather than failing the trip or treating as uniform.
   * - Days <= 16 days from destination-local today receive real forecast (high/medium confidence).
   * - Days > 16 days receive destination historical climate estimates (low confidence).
   * - If archive is unreachable, applies conservative, qualified low-confidence fallback (no fake clear sky).
   */
  async fetchForecast(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    days: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, days, timezone } = params;
    const tzKey = timezone || 'auto';
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}:${tzKey}:${startDate}:${days}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Identify per-day horizon status
    const dayDates: string[] = [];
    const dayIsForecast: boolean[] = [];

    for (let i = 0; i < days; i++) {
      const dateStr = addDaysToDate(startDate, i);
      dayDates.push(dateStr);
      const diff = getDaysDifference(dateStr, timezone);
      dayIsForecast.push(diff >= 0 && diff <= MAX_FORECAST_HORIZON_DAYS);
    }

    // 2. Partition into contiguous execution segments
    interface DaySegment {
      isForecast: boolean;
      startIndex: number;
      count: number;
      startDate: string;
      endDate: string;
    }

    const segments: DaySegment[] = [];
    let currentSegment: DaySegment | null = null;

    for (let i = 0; i < days; i++) {
      const isFc = dayIsForecast[i];
      if (!currentSegment || currentSegment.isForecast !== isFc) {
        currentSegment = {
          isForecast: isFc,
          startIndex: i,
          count: 1,
          startDate: dayDates[i],
          endDate: dayDates[i],
        };
        segments.push(currentSegment);
      } else {
        currentSegment.count++;
        currentSegment.endDate = dayDates[i];
      }
    }

    // 3. Resolve each segment independently
    const finalForecasts: DayForecast[] = new Array(days);

    for (const seg of segments) {
      if (seg.isForecast) {
        let segData: DayForecast[] | null = null;
        try {
          segData = await this.fetchLiveForecastSegment({
            latitude,
            longitude,
            startDate: seg.startDate,
            endDate: seg.endDate,
            count: seg.count,
            timezone,
          });
        } catch {
          // If live forecast fails, fall back to historical archive for this segment
          try {
            segData = await this.fetchArchiveSegment({
              latitude,
              longitude,
              startDate: seg.startDate,
              endDate: seg.endDate,
              count: seg.count,
              timezone,
            });
          } catch {
            segData = this.generateQualifiedFallbackForecast(
              dayDates.slice(seg.startIndex, seg.startIndex + seg.count)
            );
          }
        }

        for (let j = 0; j < seg.count; j++) {
          finalForecasts[seg.startIndex + j] = segData[j];
        }
      } else {
        // Beyond forecast horizon -> historical climate archive
        let segData: DayForecast[] | null = null;
        try {
          segData = await this.fetchArchiveSegment({
            latitude,
            longitude,
            startDate: seg.startDate,
            endDate: seg.endDate,
            count: seg.count,
            timezone,
          });
        } catch {
          segData = this.generateQualifiedFallbackForecast(
            dayDates.slice(seg.startIndex, seg.startIndex + seg.count)
          );
        }

        for (let j = 0; j < seg.count; j++) {
          finalForecasts[seg.startIndex + j] = segData[j];
        }
      }
    }

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: finalForecasts,
    });

    return finalForecasts;
  }

  /**
   * Fetches live daily forecast for a slice within the 16-day horizon.
   */
  private async fetchLiveForecastSegment(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    count: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, endDate, count, timezone } = params;
    const tzParam = timezone ? encodeURIComponent(timezone) : 'auto';
    const url = `${FORECAST_API_URL}?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=${tzParam}&start_date=${startDate}&end_date=${endDate}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Live forecast request failed with HTTP ${res.status}`);
    const data = await res.json();
    return this.parseOpenMeteoDaily(data.daily, startDate, count, {
      estimated: false,
      source: 'forecast',
      timezone,
    });
  }

  /**
   * Queries historical archive for exact calendar dates 1 year prior.
   */
  private async fetchArchiveSegment(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    count: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, endDate, count, timezone } = params;
    const prevYearStart = shiftYear(startDate, -1);
    const prevYearEnd = shiftYear(endDate, -1);
    const tzParam = timezone ? encodeURIComponent(timezone) : 'auto';

    const url = `${ARCHIVE_API_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${prevYearStart}&end_date=${prevYearEnd}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=${tzParam}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Archive request failed with HTTP ${res.status}`);
    const data = await res.json();
    return this.parseOpenMeteoDaily(data.daily, startDate, count, {
      estimated: true,
      source: 'historical_estimate',
      timezone,
    });
  }

  /**
   * Parses Open-Meteo daily response array into normalized DayForecast[].
   * Maps indices directly to target dates to guarantee exact alignment.
   */
  private parseOpenMeteoDaily(
    daily: OpenMeteoDailyData | null | undefined,
    targetStartDate: string,
    count: number,
    options: {
      estimated: boolean;
      source: 'forecast' | 'historical_estimate';
      timezone?: string;
    }
  ): DayForecast[] {
    if (!daily || !Array.isArray(daily.time)) {
      return this.generateQualifiedFallbackForecast(
        Array.from({ length: count }, (_, i) => addDaysToDate(targetStartDate, i))
      );
    }

    const results: DayForecast[] = [];

    for (let idx = 0; idx < count; idx++) {
      const dateStr = addDaysToDate(targetStartDate, idx);
      const diff = getDaysDifference(dateStr, options.timezone);

      // Distinguish near-term vs medium-term forecast confidence
      const confidence: 'high' | 'medium' | 'low' = options.estimated
        ? 'low'
        : diff <= 7
        ? 'high'
        : 'medium';

      results.push({
        date: dateStr,
        weatherCode: daily.weather_code?.[idx] ?? 3,
        maxTemp: Number((daily.temperature_2m_max?.[idx] ?? 22).toFixed(1)),
        minTemp: Number((daily.temperature_2m_min?.[idx] ?? 14).toFixed(1)),
        windSpeed: Number((daily.wind_speed_10m_max?.[idx] ?? 12).toFixed(1)),
        precipitationMm: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
        estimated: options.estimated,
        temporalResolution: 'daily',
        source: options.source,
        confidence,
      });
    }

    return results;
  }

  /**
   * Safe, qualified low-confidence fallback baseline when both forecast
   * and historical archive feeds are unavailable.
   * Strictly avoids false certainty (does NOT classify unknown weather as confirmed clear/sunny).
   */
  private generateQualifiedFallbackForecast(dates: string[]): DayForecast[] {
    return dates.map((dateStr) => ({
      date: dateStr,
      weatherCode: 3, // Overcast / unconfirmed
      maxTemp: 22,
      minTemp: 14,
      windSpeed: 15,
      precipitationMm: 1.0,
      estimated: true,
      temporalResolution: 'daily',
      source: 'fallback_estimate',
      confidence: 'low',
    }));
  }
}
