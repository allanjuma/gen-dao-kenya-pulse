
/// <reference path="./types.d.ts" />
import { WebSocketServer } from './WebSocketServer';

// Define interface for DurableObjectNamespace
interface Env {
  WEBSOCKET_DO: DurableObjectNamespace;
}

// Main worker that handles requests
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket connections to /ws endpoint
    if (url.pathname === '/ws') {
      return handleWebSocketConnection(request, env);
    }
    
    // For all other routes, return a simple HTML page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>genDAO Kenya Pulse WebSocket Server</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>genDAO Kenya Pulse WebSocket Server</h1>
        <p>This is the WebSocket server for the genDAO Kenya Pulse application.</p>
        <p>Connect to the WebSocket endpoint at: <code>wss://${url.host}/ws</code></p>
      </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
        },
      },
    );
  },
};

// Function to handle WebSocket connections
async function handleWebSocketConnection(request: Request, env: Env): Promise<Response> {
  // Get ID of the Durable Object instance that will handle this connection
  const id = env.WEBSOCKET_DO.idFromName('SINGLETON');
  
  // Get a stub for the Durable Object instance
  const stub = env.WEBSOCKET_DO.get(id);
  
  // Forward the request to the Durable Object
  return stub.fetch(request);
}

// Durable Object definition
export class WebSocketDurableObject {
  private server: WebSocketServer;
  
  constructor() {
    this.server = new WebSocketServer();
  }
  
  async fetch(request: Request): Promise<Response> {
    return this.server.handleConnection(request);
  }
}
