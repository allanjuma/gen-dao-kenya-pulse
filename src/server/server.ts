
import express from 'express';
import http from 'http';
import { WebSocketServer as WSServer } from 'ws';
import path from 'path';
import { AppState, WebSocketHandler } from './WebSocketHandler';

// Constants
const PORT = process.env.PORT || 8787;

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WSServer({ server });

// Initialize application state
const appState = new AppState();
const webSocketHandler = new WebSocketHandler(appState);

// Setup WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('Client connected');
  webSocketHandler.handleConnection(ws, req);
  
  ws.on('error', console.error);
});

// Serve static files (for production builds)
app.use(express.static(path.join(__dirname, '../../dist')));

// Route for health checks and server info
app.get('/', (req, res) => {
  res.send(`
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
      <p>Connect to the WebSocket endpoint at: <code>ws://${req.headers.host}/ws</code></p>
    </body>
    </html>
  `);
});

// Catch-all route to serve React app (if using SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
