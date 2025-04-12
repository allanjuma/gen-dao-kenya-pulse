
# genDAO Kenya Pulse WebSocket Server

This directory contains the WebSocket server implementation for the genDAO Kenya Pulse application. The server is built to run on Cloudflare Workers with Durable Objects for state management.

## Overview

The server provides real-time communication between clients using WebSockets. It maintains state using Cloudflare Durable Objects, which provides:

1. Strong consistency guarantees for application state
2. Low-latency responses
3. Geographic distribution for global users

## File Structure

- `WebSocketServer.ts` - Core WebSocket server implementation with state management
- `worker.ts` - Cloudflare Worker entrypoint that handles requests and defines the Durable Object
- `wrangler.toml` - Configuration file for Cloudflare Workers

## Deployment

To deploy the WebSocket server to Cloudflare Workers:

1. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```
   wrangler login
   ```

3. Navigate to the server directory:
   ```
   cd src/server
   ```

4. Deploy the worker:
   ```
   wrangler deploy
   ```

5. After deployment, update the `VITE_WEBSOCKET_URL` environment variable in your client application to point to your deployed WebSocket endpoint:
   ```
   VITE_WEBSOCKET_URL=wss://your-worker-name.your-account.workers.dev/ws
   ```

## Local Development

You can run the WebSocket server locally for development:

1. Navigate to the server directory:
   ```
   cd src/server
   ```

2. Run the development server:
   ```
   wrangler dev
   ```

3. The local WebSocket server will be available at:
   ```
   ws://localhost:8787/ws
   ```

4. The client will automatically connect to this local endpoint during development.

## Production Considerations

- In production, configure appropriate security measures, such as:
  - Rate limiting to prevent abuse
  - WebSocket origin checks
  - CORS policies for HTTP endpoints

- Monitor your Durable Object usage as it may affect billing. Consider implementing a strategy for cleaning up inactive connections and stale data.
