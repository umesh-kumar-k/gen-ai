import * as fs from 'fs';
import path, {  join, dirname } from "path";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Airport = {
  id: number;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
}

const cityToIataMap = new Map<string, string>();
const allAirportsWithIata: Airport[] = [];
const toRad = (value: number) => (value * Math.PI) / 180;


/**
 * Function generated with the help of AI
 */
export function initAirportDatabase(){

    const filePath = path.join(__dirname, 'data', 'airports.json');

    console.log(`Initializing the airport db from the data source ${filePath}`);

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const airports: Airport[] = JSON.parse(rawData);

    console.log(`Fetched ${airports?.length} no of airports`);

    for (const airport of airports) {
        // Filter out rows missing an active IATA identifier
        if (!airport.iata || airport.iata === '\\N' || airport.iata === 'N') continue;

        // Index by city (normalized to lowercase for case-insensitivity)
        const normalizedCity = airport.city?.toLowerCase().trim();
        if (!cityToIataMap.has(normalizedCity)) {
        cityToIataMap.set(normalizedCity, airport.iata);
        }
        
        allAirportsWithIata.push(airport);
  
    }

}

export function getAirportFromCityName(cityName: string): string | null {
    const normalizedCityName = cityName.toLowerCase().trim();
    const iataCode = cityToIataMap.get(normalizedCityName);
    return (iataCode ? iataCode : null);
}


export function getAirportFromCoordinates(latitude: number, longitude: number): string | null {
    return findClosestIataByCoords(latitude, longitude);
}


/**
 * Function generated with the help of AI
 * 
 * The Haversine formula calculates the great-circle distance between two pairs of coordinates on a sphere.
 */

function findClosestIataByCoords(lat: number, lon: number): string | null {
  let closestIata: string | null = null;
  let minDistance = Infinity;
  const R = 6371; // Earth's radius in kilometers

  for (let i = 0; i < allAirportsWithIata.length; i++) {
    const ap = allAirportsWithIata[i];
    
    const dLat = toRad(ap.latitude - lat);
    const dLon = toRad(ap.longitude - lon);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(ap.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < minDistance) {
      minDistance = distance;
      closestIata = ap.iata;
    }
  }

  // Optional: Set a threshold (e.g., skip if closest airport is > 150km away)
  return minDistance < 150 ? closestIata : null;
}