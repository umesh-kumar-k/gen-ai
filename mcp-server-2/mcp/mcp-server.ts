import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerWeatherTools } from "./weather-tools";
import { registerTourismTools } from "./tourism-tools";
import { registerHotelTools } from "./hotel-tools";
import { registerFlightTools } from "./flight-tools";

/**
 * Check the docs at https://render.com/articles/building-and-hosting-mcp-servers-a-complete-guid
 */ 
export async function initMCPServer():Promise<StreamableHTTPServerTransport>  { 
    const mcpServer = new McpServer({ name: "multi-domain-server", version: "1.0.0" });
    
    // Register the MCP server tools
    registerWeatherTools(mcpServer);
    registerTourismTools(mcpServer);
    registerFlightTools(mcpServer);
    registerHotelTools(mcpServer);

    // Create Streamable HTTP Transport 
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await mcpServer.connect(transport);
    return transport;
}