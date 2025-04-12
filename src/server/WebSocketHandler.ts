
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
    const messageString = JSON.stringify(message);
    
    connections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(messageString);
      }
    });
  }

  // Send message to specific user
  sendMessageToUser(userId: string, message: WebSocketMessage): void {
    const connection = this.userIdToConnectionMap.get(userId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
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
    console.log('New WebSocket connection');
    
    // Set up event handlers for the WebSocket
    ws.on('message', (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        this.handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', () => {
      this.handleClose(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleClose(ws);
    });
  }

  // Handle incoming WebSocket messages
  private handleMessage(connection: WebSocket, message: WebSocketMessage): void {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'REGISTER_USER':
        this.handleRegisterUser(connection, message.payload.userId);
        break;
        
      case 'ADD_PROPOSAL':
        this.handleAddProposal(message.payload);
        break;
        
      case 'ADD_COMMENT':
        this.handleAddComment(message.payload);
        break;
        
      case 'ADD_VOTE':
        this.handleAddVote(message.payload);
        break;
        
      case 'UPDATE_PROPOSAL_STATUS':
        this.handleUpdateProposalStatus(message.payload);
        break;
        
      case 'USER_DISCONNECT':
        this.handleUserDisconnect(message.payload.userId);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
        connection.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Unknown message type' }
        }));
    }
  }

  // Handle user registration
  private handleRegisterUser(connection: WebSocket, userId: string): void {
    const user = this.state.addUser(userId, connection);
    this.state.addConnection(userId, connection);
    
    // Send initial data to the user
    connection.send(JSON.stringify({
      type: 'INITIAL_DATA',
      payload: {
        proposals: this.state.getProposals(),
        users: this.state.getUsers()
      }
    }));
    
    // Broadcast new user to all connections
    this.state.broadcastMessage({
      type: 'NEW_USER',
      payload: user
    });
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
    this.state.removeUser(connection);
  }
}
