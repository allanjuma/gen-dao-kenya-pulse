
const { spawn } = require('child_process');
const path = require('path');

// Start the frontend development server
const frontend = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

// Start the WebSocket server
const server = spawn('node', ['src/server/dist/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down services...');
  frontend.kill();
  server.kill();
  process.exit(0);
});

console.log('Services started!');
console.log('Frontend running at http://localhost:5173');
console.log('WebSocket server running at ws://localhost:8787');
