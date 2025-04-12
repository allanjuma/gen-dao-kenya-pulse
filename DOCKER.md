
# Docker Setup for genDAO Kenya Pulse

This document explains how to run the application using Docker.

## Prerequisites

- Docker installed on your machine
- Git (to clone the repository)

## Running with Docker

1. Build the Docker image:
```bash
docker build -t genapp .
```

2. Run the application:
```bash
docker run --rm -p 5173:5173 -p 8787:8787 -v $(pwd):/app genapp
```

This command:
- Maps port 5173 (frontend) and 8787 (WebSocket server) from the container to your host
- Mounts the current directory as a volume for hot-reloading
- Removes the container when stopped (--rm)

3. Access the application:
- Frontend: http://localhost:5173
- WebSocket server: ws://localhost:8787

## Development with Docker

Any changes you make to the source code will trigger hot-reloading thanks to the volume mount.

## Stopping the Application

Press `Ctrl+C` in the terminal where the container is running to stop it.
