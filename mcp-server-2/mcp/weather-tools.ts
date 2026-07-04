import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { fetchWeatherApi } from "openmeteo";

import { z } from "zod";

/**
 * Check the docs at https://modelcontextprotocol.io/docs/develop/build-server#typescript 
 */

const COORDINATES_API_URL = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast";


export function registerWeatherTools (mcpServer: McpServer){
    
    /**
    * Check the docs at https://open-meteo.com/en/docs for examples
    */
    
    mcpServer.registerTool(
        "get_weather_forecast",
        {
            description: "Get the weather forecast for the given city",
            inputSchema: z.object({
                latitude: z.number().describe("The latitude of the city to get the weather forecast for"),
                longitude: z.number().describe("The longitude of the city to get the weather forecast for"),
                start_date: z.string().describe("Start date for the weather forecast in YYYY-MM-DD format"),
                end_date: z.string().describe("End date for the weather forecast in YYYY-MM-DD format"),
            })
        },
        async({latitude,longitude,start_date,end_date}) => {
            const params = {
                latitude: latitude,
                longitude: longitude,
                start_date: start_date,
                end_date: end_date,
                hourly: ["rain", "showers", "temperature_2m"],

            };

            const responses = await fetchWeatherApi(WEATHER_FORECAST_API_URL, params);
            const utcOffsetSeconds = responses[0].utcOffsetSeconds();
            const hourlyForecast = responses[0].hourly()!;

            // convert to a proper format
            const weatherData = {
                hourly: {
                    time: Array.from(
                        { length: (Number(hourlyForecast.timeEnd()) - Number(hourlyForecast.time())) / hourlyForecast.interval() }, 
                        (_ , i) => new Date((Number(hourlyForecast.time()) + i * hourlyForecast.interval() + utcOffsetSeconds) * 1000)
                    ),
                    rain: hourlyForecast.variables(0)!.valuesArray(),
                    showers: hourlyForecast.variables(1)!.valuesArray(),
                    temperature_2m: hourlyForecast.variables(2)!.valuesArray(),
                },
            };

            return { 
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            weatherData: weatherData,
                        })
                    },
                ],
            };

        }
    );


    /**
     * To get co-ordinates of a city, check the api at 
     * https://open-meteo.com/en/docs/geocoding-api
     * https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=10&language=en&format=json
     */
    mcpServer.registerTool(
        "get_coordinates_from_city",
        {
            description: "Get the co-ordinates of the city",
            inputSchema: z.object({
                city: z.string().describe("The name of the city to get the co-ordinates for"),
            }),
        },
        async ({ city }) => {
            // Here you can call the API to get the co-ordinates of the city

            const cityCoordinatesURL = `${COORDINATES_API_URL}?name=${city}&count=10&language=en&format=json`;
            console.error(`Fetching coordinates for city ${city} from URL: ${cityCoordinatesURL}`);

            let cityCoordinates =  await fetch(cityCoordinatesURL)
            .then((response) => response.json())
            .then((data) => {
                if (data.results && data.results.length > 0) {
                    const { latitude, longitude, country } = data.results[0];
                    return { latitude, longitude, country };
                } else {
                    throw new Error(`No results found for city: ${city}`);
                }
            })
            .catch((error) => {
                console.error(`Error fetching coordinates for city ${city}:`, error);
                throw error;
            });

            console.log(`Coordinates for city ${city}:`, cityCoordinates); 

            return { 
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            country: cityCoordinates.country,
                            latitude: cityCoordinates.latitude,
                            longitude: cityCoordinates.longitude,
                        })
                    },
                ],
            };
        }
    ); 
}

