
// TypeScript definitions for Cloudflare Workers

interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
}

interface ResponseInitWithWebSocket extends ResponseInit {
  webSocket: WebSocket;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString: () => string;
}

interface DurableObjectStub {
  fetch: (request: Request) => Promise<Response>;
}

// Extend the Response constructor to accept ResponseInitWithWebSocket
declare global {
  interface ResponseConstructor {
    new(body?: BodyInit | null, init?: ResponseInit | ResponseInitWithWebSocket): Response;
  }
}
