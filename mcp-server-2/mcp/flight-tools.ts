import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { fetchWeatherApi } from "openmeteo";
import { getJson } from "serpapi";

import { getAirportFromCityName, getAirportFromCoordinates } from '../utils/airports-helper';

import { z } from "zod";



export function registerFlightTools (mcpServer: McpServer){
    
    /**
     * Get the airport code from the city name
     */
    mcpServer.registerTool(
        "get_airport_iata_code_by_city",
        {
            description: "Get the airport IATA code by city name",
            inputSchema: z.object({
                city: z.string().describe("Name of the city")
            })
        },
        async({city}): Promise<any> => {
            const iataCode = getAirportFromCityName(city);
            console.error(`IATA code for the city ${city} is ${iataCode}`);
            return { 
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            airport_iata_code: iataCode,
                        })
                    },
                ],
            };
        }   
    );

    /**
     * Get the nearest airport code based on the co-ordinates
     */
    mcpServer.registerTool(
        "get_airport_iata_code_by_coordinates",
        {
            description: "Get the airport IATA code by city co-ordinates",
            inputSchema: z.object({
                latitude: z.number().describe("latitude"),
                longitude: z.number().describe("longitude")
            })
        },
        async({latitude,longitude}): Promise<any> => {
            const iataCode = getAirportFromCoordinates(latitude,longitude);
            console.error(`IATA code for the airport nearby ${latitude} , ${longitude} is ${iataCode}`);
            return { 
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            airport_iata_code: iataCode,
                        })
                    },
                ],
            };
        }   
    );

    
    /**
    * Check the docs at https://serpapi.com/google-flights-api for examples
    */
    
    mcpServer.registerTool(
        "get_flight_details",
        {
            description: "Get the flight details from the departure city to arrival city",
            inputSchema: z.object({
                departure_code: z.string().describe("The IATA code of the departure airport"),
                arrival_code: z.string().describe("The IATA code of the arrival airport"),
                outbound_date: z.string().describe("Date of Departure in YYYY-MM-DD format"),
                return_date: z.string().describe("Optional Date of Return trip in YYYY-MM-DD format"),
            })
        },
        async({departure_code,arrival_code,outbound_date,return_date}): Promise<any> => {
            
            console.error(`Calling Flight Details search API with the args Departure Code : ${departure_code}, Arrival Code ${arrival_code}, Outbound Date : ${outbound_date}, Return Date: ${return_date}`);


            if(!process.env.GOOGLE_SERP_API_KEY) {
                console.error('Unable to find the API Key');
                return null;
            }

            try {
                const response = await getJson({
                    engine: "google_flights",
                    api_key: process.env.GOOGLE_SERP_API_KEY,
                    departure_id: departure_code,
                    arrival_id: arrival_code,     
                    outbound_date: outbound_date, 
                    return_date: return_date,   
                    type: (return_date == null ? 2: 1), // // 1 for Round Trip, 2 for One-Way
                    currency: "USD",
                    hl: "en",
                    limit: 10                   
                });

                console.error(`Google Flights API response ${response}`);

                return { 
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                flightDetails: response,
                            })
                        },
                    ],
                };
            }

            catch(error) {
                console.error(`Error fetching flights from ${departure_code}: to ${arrival_code}`, error);
                throw error;
            }

        }
    );


}
