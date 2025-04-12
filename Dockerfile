
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY src/server/package.json ./src/server/

# Install dependencies for both frontend and server
RUN npm install
RUN cd src/server && npm install

# Copy the rest of the application
COPY . .

# Build the server
RUN cd src/server && npm run build

# Expose ports for frontend and WebSocket server
EXPOSE 5173
EXPOSE 8787

# Create a script to run both services
COPY run-services.js .

# Command to start both the frontend and backend
CMD ["node", "run-services.js"]
