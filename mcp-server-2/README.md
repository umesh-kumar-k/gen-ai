# README

Check out the article at https://render.com/articles/building-and-hosting-mcp-servers-a-complete-guide for details on setting up MCP server in node & hosting it on render.com 


# Steps

1. Create the MCP server & add the tools 
2. Run the node/express server & serve the mcp server from /mcp endpoint
3. Run MCP inspector to connect & test tools 
    - npx @modelcontextprotocol/inspector
4. Test the tools with MCP Inspector 


# npm install 

  - express
  - @modelcontextprotocol/sdk
  - openmeteo (type script sdk for open meteo API)
  - dev dependencies
    - @types/express
    - @types/node
    - tsx
    - typescript
    - @types/cors
  - cors
  - overpass-ts
  - dotenv
  - serpapi (Google Search API for flights/hotels)
  - 

# mcp server 

  - Check out the docs at https://modelcontextprotocol.io/docs/develop/build-server#typescript 

# weather tools 

  - Check out the docs at https://open-meteo.com/en/docs for using Open Meteo API on free tier to get the weather forecast 

# places api

  Options:

  - Check out the docs at https://apidocs.geoapify.com/

  - Use Travily Search API (1000 requests per month free)
    "top tourist attractions in [City Name]" or "hidden gems in [City Name]"

  - jina.ai 

  - Overpass API/OpenStreetMap


# flights/hotels

  Options: 
    - Google Serp API -> 250 requests per month 
    - rapid api ->  100 requests per month 
    - tavily -> 1000 requests per month

    Flights Only
      - https://airlabs.co/ -> 1000 queries per month



# Examples

1. Sample MCP requests

``` json

  {
    "method": "tools/call",
    "params": {
      "name": "get_weather_forecast",
      "arguments": {
        "latitude": 50,
        "longitude": 60,
        "start_date": "2026-07-03",
        "end_date": "2026-07-05"
      },
      "_meta": {
        "progressToken": 3
      }
    },
    "jsonrpc": "2.0",
    "id": 3
  }

```

``` json
  {
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {
        "sampling": {},
        "elicitation": {
          "form": {},
          "url": {}
        },
        "roots": {
          "listChanged": true
        },
        "tasks": {
          "list": {},
          "cancel": {},
          "requests": {
            "sampling": {
              "createMessage": {}
            },
            "elicitation": {
              "create": {}
            }
          }
        }
      },
      "clientInfo": {
        "name": "inspector-client",
        "version": "0.22.0"
      }
    },
    "jsonrpc": "2.0",
    "id": 0
  }

```


``` json

  {
    "method": "tools/list",
    "params": {
      "_meta": {
        "progressToken": 1
      }
    },
    "jsonrpc": "2.0",
    "id": 1
  }

``` 