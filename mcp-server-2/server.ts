
import express from "express";
import cors from "cors"; 
import dotenv from "dotenv";

import { initMCPServer } from "./mcp/mcp-server";
import { landingPage } from './utils/static-landing-page';
import { initAirportDatabase } from './utils/airports-helper';

// read env files
dotenv.config();

// initialize airport db
initAirportDatabase();

console.error(`Developer Name :${process.env.DEV_NAME}`);

// Express server to serve the MCP server and provide a simple HTML page
const port = process.env.PORT || 3001;
const app = express();

// Enable CORS globally for your local development endpoints
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "mcp-session-id", "mcp-protocol-version", "authorization"],
  exposedHeaders: ["mcp-session-id"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Intercept options manually to completely bypass the routing string engine
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id, mcp-protocol-version, authorization");
    res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
    return res.sendStatus(204); // Clean 'No Content' response for preflights
  }
  next();
});

// Serve the MCP server on the /mcp endpoint 
app.post("/mcp", async (req, res) => {
  console.error(`Received MCP request: ${JSON.stringify(req.body, null, 2)}`);
  try {
    // Initailize the MCP server & Set up the Streamable HTTP transport
    const transport = await initMCPServer();
    await transport.handleRequest(req, res, req.body);
  }
  catch(error) {
    console.error("MCP Protocol Error:", error);
    // Explicitly guarantee JSON output with CORS intact during internal failures
    if (!res.headersSent) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(500).json({ error: "Internal MCP Protocol Routing Failure" });
    }
  }
});

// Express Server - Listen on the port 
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

// Serve static html page 
app.get("/", (req, res) => res.type('html').send(landingPage));



