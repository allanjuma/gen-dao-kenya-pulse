
# genDAO Kenya Pulse WebSocket Server

This directory contains the WebSocket server implementation for the genDAO Kenya Pulse application. The server is built using Express.js and the ws library.

## Overview

The server provides real-time communication between clients using WebSockets. It maintains state in-memory, handling:

1. User connections and management
2. Proposal creation and management 
3. Comments and voting
4. Real-time updates between all connected clients

## File Structure

- `server.ts` - Express server entry point that sets up HTTP and WebSocket servers
- `WebSocketHandler.ts` - Core WebSocket handler implementation with state management
- `package.json` - Dependencies and scripts for the server
- `tsconfig.json` - TypeScript configuration for the server

## Deployment

To deploy the WebSocket server:

1. Navigate to the server directory:
   ```
   cd src/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the server:
   ```
   npm run build
   ```

4. Start the server:
   ```
   npm start
   ```

5. After deployment, update the `VITE_WEBSOCKET_URL` environment variable in your client application to point to your deployed WebSocket endpoint:
   ```
   VITE_WEBSOCKET_URL=ws://your-server-hostname:8787
   ```

## Local Development

You can run the WebSocket server locally for development:

1. Navigate to the server directory:
   ```
   cd src/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. The local WebSocket server will be available at:
   ```
   ws://localhost:8787
   ```

5. The client will automatically connect to this local endpoint during development.

## Production Considerations

- In production, consider:
  - Using a process manager like PM2 to keep the server running
  - Setting up a reverse proxy (like Nginx) to handle SSL termination
  - Implementing rate limiting to prevent abuse
  - Adding authentication for WebSocket connections

- This implementation uses in-memory storage which doesn't persist between server restarts. For production, consider implementing:
  - Database integration for persistent storage
  - Redis for scaling WebSocket connections across multiple server instances
