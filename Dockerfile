FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./
# Copy server package file if it exists
COPY src/server/package*.json ./src/server/

# Install all dependencies (including devDependencies)
# Needed for vite, tsx, concurrently, etc.
RUN npm install
# Install server dependencies if server package.json exists
# Make sure server dev dependencies are installed
RUN if [ -f src/server/package.json ]; then cd src/server && npm install; fi

# Copy source code as a fallback if volume isn't mounted
# The volume mount in docker run will overlay this
COPY . .

# Expose ports for Vite dev server and WebSocket server
EXPOSE 5173 8787

# Command to run the development servers with hot reload
# Assumes 'npm run dev' is configured with concurrently/tsx
CMD ["npm", "run", "dev"]
