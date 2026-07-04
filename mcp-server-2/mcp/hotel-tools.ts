import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { fetchWeatherApi } from "openmeteo";
import { getJson } from "serpapi";


import { z } from "zod";



export function registerHotelTools (mcpServer: McpServer){
    
    /**
    * Check the docs at https://serpapi.com/google-hotels-api for examples
    */
    
    mcpServer.registerTool(
        "get_hotel_details",
        {
            description: "Get the hotel details for the city",
            inputSchema: z.object({
                city: z.string().describe("The name of the destination city"),
                check_in_date: z.string().describe("Date of the Hotel checkout in YYYY-MM-DD format"),
                check_out_date: z.string().describe("Date of Hotel checkout in YYYY-MM-DD format"),
                adults: z.string().describe("The number of adults who need accomodation"),
                children: z.string().describe("The number of children who need accomodation")
            })
        },
        async({city,check_in_date,check_out_date,adults,children}): Promise<any> => {
            
            console.error(`Calling Hotel Details search API with the args City : ${city}, Check In Date ${check_in_date}, Check Out Date : ${check_out_date}, Adults : ${adults}, Kids : ${children}`);


            if(!process.env.GOOGLE_SERP_API_KEY) {
                console.error('Unable to find the API Key');
                return null;
            }

            try {
                const response = await getJson({
                    engine: "google_hotels",
                    api_key: process.env.GOOGLE_SERP_API_KEY,
                    q: city,     
                    check_in_date: check_in_date, 
                    check_out_date: check_out_date,   
                    adults: (adults == null ? 0: adults),
                    children: (children == null ? 0: children),
                    currency: "USD",
                    limit: 10                   
                });

                console.error(`Google Hotels API response ${response}`);

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
                console.error(`Error fetching Hotel details for  ${city}`, error);
                throw error;
            }

        }
    );


}
