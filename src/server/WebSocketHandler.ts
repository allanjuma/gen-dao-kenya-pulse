import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WebSocketMessage, Proposal, User, Comment, Vote, Transaction } from '@/types';

// In-memory storage for our application state
export class AppState {
  private proposals: Proposal[] = [];
  private users: User[] = [];
  private connections: Map<string, WebSocket> = new Map();
  private userIdToConnectionMap: Map<string, WebSocket> = new Map();
  private connectionToUserIdMap: Map<WebSocket, string> = new Map();

  // Getters for state
  getProposals(): Proposal[] {
    return this.proposals;
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(userId: string): User | undefined {
    return this.users.find(user => user.id === userId);
  }

  getProposalById(proposalId: string): Proposal | undefined {
    return this.proposals.find(proposal => proposal.id === proposalId);
  }

  // User management
  addUser(userId: string, connection: WebSocket): User {
    const existingUser = this.getUserById(userId);
    
    if (existingUser) {
      // Update last active timestamp
      const updatedUser = {
        ...existingUser,
        lastActive: new Date().toISOString()
      };
      
      this.users = this.users.map(user => 
        user.id === userId ? updatedUser : user
      );
      
      // Update connection mapping
      this.userIdToConnectionMap.set(userId, connection);
      this.connectionToUserIdMap.set(connection, userId);
      
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userId,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isFirstUser: this.users.length === 0
      };
      
      this.users.push(newUser);
      this.userIdToConnectionMap.set(userId, connection);
      this.connectionToUserIdMap.set(connection, userId);
      
      return newUser;
    }
  }

  removeUser(connection: WebSocket): void {
    const userId = this.connectionToUserIdMap.get(connection);
    
    if (userId) {
      this.userIdToConnectionMap.delete(userId);
      this.connectionToUserIdMap.delete(connection);
      this.connections.delete(userId);
    }
  }

  // Connection management
  addConnection(userId: string, connection: WebSocket): void {
    this.connections.set(userId, connection);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  getAllConnections(): WebSocket[] {
    return Array.from(this.connections.values());
  }

  // Proposal management
  addProposal(proposal: Omit<Proposal, 'id' | 'createdAt' | 'comments' | 'votes' | 'transactions'> & { creatorId: string }): Proposal {
    const newProposal: Proposal = {
      id: `proposal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: proposal.title,
      description: proposal.description,
      creatorId: proposal.creatorId,
      treasuryPhone: proposal.treasuryPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      comments: [],
      votes: [],
      transactions: []
    };
    
    this.proposals.unshift(newProposal); // Add to beginning of array
    return newProposal;
  }

  // Comment management
  addComment(proposalId: string, userId: string, content: string): Comment | null {
    const proposal = this.getProposalById(proposalId);
    
    if (!proposal) return null;
    
    // Check if user has already commented
    const hasCommented = proposal.comments.some(comment => comment.userId === userId);
    if (hasCommented) return null;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      sentiment: null
    };
    
    // Update the proposal with the new comment
    this.proposals = this.proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    });
    
    return newComment;
  }

  // Vote management
  addVote(proposalId: string, userId: string, inFavor: boolean): Vote | null {
    const proposal = this.getProposalById(proposalId);
    
    if (!proposal) return null;
    
    const newVote: Vote = {
      userId,
      inFavor
    };
    
    // Remove existing vote by this user if it exists
    const filteredVotes = proposal.votes.filter(vote => vote.userId !== userId);
    
    // Update the proposal with the new vote
    this.proposals = this.proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          votes: [...filteredVotes, newVote]
        };
      }
      return p;
    });
    
    return newVote;
  }

  // Proposal status management
  updateProposalStatus(proposalId: string, status: 'pending' | 'active' | 'rejected'): Proposal | null {
    const proposal = this.getProposalById(proposalId);
    
    if (!proposal) return null;
    
    // Update the proposal status
    this.proposals = this.proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    
    return this.getProposalById(proposalId);
  }

  // Broadcasting messages
  broadcastMessage(message: WebSocketMessage): void {
    const connections = this.getAllConnections();
    let messageString: string;
    // Log the raw message object before trying to stringify
    console.log(`[AppState] Attempting to broadcast message:`, message);
    try {
      messageString = JSON.stringify(message);
    } catch (error) {
      console.error(`[AppState] Error stringifying broadcast message:`, error);
      console.error(`[AppState] Message data that failed:`, message); // Log the data
      return; // Don't attempt to send if stringify failed
    }
    
    connections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(messageString);
        } catch (error) {
          console.error(`[AppState] Error sending broadcast message to one connection:`, error);
        }
      }
    });
  }

  // Send message to specific user
  sendMessageToUser(userId: string, message: WebSocketMessage): void {
    const connection = this.userIdToConnectionMap.get(userId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      let messageString: string;
      // Log the raw message object before trying to stringify
      console.log(`[AppState] Attempting to send message to user ${userId} (type: ${message.type}):`, message);
      try {
        messageString = JSON.stringify(message);
      } catch (error) {
        console.error(`[AppState] Error stringifying message for user ${userId}:`, error);
        console.error(`[AppState] Message data that failed:`, message); // Log the data
        return; // Don't attempt to send if stringify failed
      }
      try {
        connection.send(messageString);
      } catch (error) {
        console.error(`[AppState] Error sending message to user ${userId}:`, error);
      }
    } else {
       console.warn(`[AppState] Could not send message to user ${userId}: Connection not found or not open.`);
    }
  }

  // Get user ID associated with a WebSocket connection
  getUserIdByConnection(connection: WebSocket): string | undefined {
    return this.connectionToUserIdMap.get(connection);
  }
}

// WebSocket Handler class
export class WebSocketHandler {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  // Handle new WebSocket connection
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    console.log(`[WebSocketHandler] New connection established. URL: ${req.url}`);
    
    // Log client IP (if available through headers)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[WebSocketHandler] Client IP: ${clientIp}`);

    // Set up event handlers for the WebSocket
    ws.on('message', (message: Buffer) => {
      console.log(`[WebSocketHandler] Received raw message: ${message.toString()}`);
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        console.log(`[WebSocketHandler] Parsed message:`, parsedMessage);
        this.handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error('[WebSocketHandler] Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[WebSocketHandler] Connection closed. Code: ${code}, Reason: ${reason.toString()}`);
      this.handleClose(ws);
    });
    
    ws.on('error', (error: Error) => {
      console.error(`[WebSocketHandler] WebSocket error: ${error.message}`, error);
      // Optionally close connection on error if not already handled by 'close'
      this.handleClose(ws);
    });
  }

  // Handle incoming WebSocket messages
  private handleMessage(connection: WebSocket, message: WebSocketMessage): void {
    console.log(`[WebSocketHandler] Handling message type: ${message.type}`);
    try {
      switch (message.type) {
        case 'REGISTER_USER':
          console.log('[WebSocketHandler] Processing REGISTER_USER');
          this.handleRegisterUser(connection, message.payload.userId);
          break;
        case 'ADD_PROPOSAL':
          console.log('[WebSocketHandler] Processing ADD_PROPOSAL');
          this.handleAddProposal(message.payload);
          break;
        case 'ADD_COMMENT':
          console.log('[WebSocketHandler] Processing ADD_COMMENT');
          this.handleAddComment(message.payload);
          break;
        case 'ADD_VOTE':
          console.log('[WebSocketHandler] Processing ADD_VOTE');
          this.handleAddVote(message.payload);
          break;
        case 'UPDATE_PROPOSAL_STATUS':
          console.log('[WebSocketHandler] Processing UPDATE_PROPOSAL_STATUS');
          this.handleUpdateProposalStatus(message.payload);
          break;
        case 'USER_DISCONNECT':
          this.handleUserDisconnect(message.payload.userId);
          break;
        default:
          console.warn(`[WebSocketHandler] Received unknown message type: ${message.type}`);
          connection.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Unknown message type' } }));
      }
    } catch (error) {
      console.error(`[WebSocketHandler] Error processing message type ${message.type}:`, error);
      try {
        connection.send(JSON.stringify({
          type: 'ERROR',
          payload: { 
            message: `Server error processing message type ${message.type}`,
            errorDetails: error instanceof Error ? error.message : 'Unknown error' 
          }
        }));
      } catch (sendError) {
        console.error(`[WebSocketHandler] Failed to send error message back to client:`, sendError);
      }
    }
  }

  // Handle user registration
  private handleRegisterUser(connection: WebSocket, userId: string): void {
    console.log(`[WebSocketHandler] Attempting to register user: ${userId}`);
    try {
      const newUser = this.state.addUser(userId, connection);
      console.log(`[WebSocketHandler] User registered/updated: ${userId}`, newUser);
      this.state.addConnection(userId, connection);
      
      // Send ONLY the confirmation message for debugging
      // Use a simplified payload first
      this.state.sendMessageToUser(userId, { type: 'USER_REGISTERED', payload: { userId: newUser.id, status: 'ok' } }); 
      
      // Temporarily comment out other sends
      // this.state.sendMessageToUser(userId, { type: 'INITIAL_STATE', payload: { proposals: this.state.getProposals() } });
      // this.state.broadcastMessage({ type: 'UPDATE_USERS', payload: this.state.getUsers() });
      
      console.log(`[WebSocketHandler] Finished processing REGISTER_USER for: ${userId}`);
    } catch (error) {
      console.error(`[WebSocketHandler] Error in handleRegisterUser for ${userId}:`, error);
    }
  }

  // Handle new proposal creation
  private handleAddProposal(payload: any): void {
    const newProposal = this.state.addProposal({
      title: payload.title,
      description: payload.description,
      creatorId: payload.creatorId,
      treasuryPhone: payload.treasuryPhone,
      status: 'pending',
      updatedAt: null
    });
    
    this.state.broadcastMessage({
      type: 'NEW_PROPOSAL',
      payload: newProposal
    });
  }

  // Handle new comment addition
  private handleAddComment(payload: any): void {
    const { proposalId, content, userId } = payload;
    const newComment = this.state.addComment(proposalId, userId, content);
    
    if (newComment) {
      this.state.broadcastMessage({
        type: 'NEW_COMMENT',
        payload: {
          proposalId,
          comment: newComment
        }
      });
    }
  }

  // Handle new vote addition
  private handleAddVote(payload: any): void {
    const { proposalId, inFavor, userId } = payload;
    const newVote = this.state.addVote(proposalId, userId, inFavor);
    
    if (newVote) {
      this.state.broadcastMessage({
        type: 'NEW_VOTE',
        payload: {
          proposalId,
          vote: newVote
        }
      });
    }
  }

  // Handle proposal status update
  private handleUpdateProposalStatus(payload: any): void {
    const { proposalId, status } = payload;
    const updatedProposal = this.state.updateProposalStatus(proposalId, status);
    
    if (updatedProposal) {
      this.state.broadcastMessage({
        type: 'UPDATE_PROPOSAL_STATUS',
        payload: {
          proposalId,
          status,
          updatedAt: updatedProposal.updatedAt
        }
      });
    }
  }

  // Handle user disconnection
  private handleUserDisconnect(userId: string): void {
    this.state.removeConnection(userId);
  }

  // Handle WebSocket close event
  private handleClose(connection: WebSocket): void {
    try { 
      console.log(`[WebSocketHandler] Cleaning up connection...`); 
      // Use the public getter method from AppState
      const userId = this.state.getUserIdByConnection(connection);
      if (userId) {
        console.log(`[WebSocketHandler] Removing user ${userId} due to connection close.`);
        this.state.removeUser(connection); 
        console.log(`[WebSocketHandler] Broadcasting user list update after closing connection for ${userId}.`);
        this.state.broadcastMessage({ type: 'UPDATE_USERS', payload: this.state.getUsers() });
      } else {
        console.log(`[WebSocketHandler] Connection closed for a user not found in map.`); 
      }
      console.log(`[WebSocketHandler] Finished cleaning up connection.`); 
    } catch (error) {
      console.error(`[WebSocketHandler] Error occurred during handleClose:`, error);
    }
  }
}
