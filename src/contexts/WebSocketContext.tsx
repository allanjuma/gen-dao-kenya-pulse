import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Proposal, User, WebSocketMessage } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';

// Use environment variable with fallback for local development
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || (window.location.protocol === 'https:' 
  ? `wss://${window.location.host}/ws` 
  : `ws://${window.location.hostname}:8787`);

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;

interface WebSocketContextType {
  proposals: Proposal[];
  activeUsers: User[];
  currentUser: User | null;
  isConnected: boolean;
  isLoading: boolean;
  connectionError: string | null;
  addProposal: (proposal: Omit<Proposal, 'id' | 'creatorId' | 'createdAt' | 'comments' | 'votes' | 'transactions' | 'status'>) => void;
  addComment: (proposalId: string, content: string) => void;
  addVote: (proposalId: string, inFavor: boolean) => void;
  updateProposalStatus: (proposalId: string, status: 'pending' | 'active' | 'rejected') => void;
  retryConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Helper to get or generate a user ID
const getUserId = () => {
  const storedUserId = localStorage.getItem('gendao-user-id');
  if (storedUserId) return storedUserId;
  
  const newUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('gendao-user-id', newUserId);
  return newUserId;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Send message to WebSocket server
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      socketRef.current.send(message);
      console.log('Sent message:', type, payload);
    } else {
      console.error('WebSocket not connected, cannot send message');
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please retry the connection.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Function to manually retry connection
  const retryConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttempts.current = 0;
    setConnectionError(null);
    setIsLoading(true);
    
    // Force reconnection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // This will trigger the useEffect to reconnect
    setSocket(null);
    
    sonnerToast.success("Retrying connection...");
  }, []);

  // Connect to WebSocket server
  useEffect(() => {
    setIsLoading(true);
    const userId = getUserId();
    
    const connectWebSocket = () => {
      try {
        console.log(`Connecting to WebSocket at ${WS_URL}, attempt #${reconnectAttempts.current + 1}`);
        setConnectionError(null);
        
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;
        setSocket(ws);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            ws.close();
          }
        }, 10000); // 10 seconds connection timeout
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts.current = 0;
          
          
          // Register user with server
          sendMessage('REGISTER_USER', { userId });
          
          // Show success toast only if previously disconnected
          if (!isConnected) {
            sonnerToast.success("Connected to server");
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log('Received message:', data);
            
            switch (data.type) {
              case 'USER_REGISTERED':
                console.log('Received USER_REGISTERED: ', data.payload);
                break;

              case 'INITIAL_DATA':console
                setProposals(data.payload.proposals || []);
                setActiveUsers(data.payload.users || []);
                
                // Find current user in the active users list
                const foundUser = data.payload.users.find((user: User) => user.id === userId);
                if (foundUser) {
                  setCurrentUser(foundUser);
                }
                
                setIsLoading(false);
                break;
                
              case 'NEW_USER':
                setActiveUsers(prev => [...prev, data.payload]);
                toast({
                  title: "New User Joined",
                  description: `A new user has joined the platform.`,
                });
                break;
                
              case 'NEW_PROPOSAL':
                setProposals(prev => [data.payload, ...prev]);
                toast({
                  title: "New Proposal",
                  description: `A new proposal has been created: ${data.payload.title}`,
                });
                break;
                
              case 'NEW_COMMENT':
                setProposals(prev => prev.map(p => {
                  if (p.id === data.payload.proposalId) {
                    return {
                      ...p,
                      comments: [...p.comments, data.payload.comment]
                    };
                  }
                  return p;
                }));
                break;
                
              case 'NEW_VOTE':
                setProposals(prev => prev.map(p => {
                  if (p.id === data.payload.proposalId) {
                    // Remove existing vote from this user if it exists
                    const filteredVotes = p.votes.filter(v => v.userId !== data.payload.vote.userId);
                    
                    // Add the new vote
                    return {
                      ...p,
                      votes: [...filteredVotes, data.payload.vote]
                    };
                  }
                  return p;
                }));
                break;
                
              case 'UPDATE_PROPOSAL_STATUS':
                setProposals(prev => prev.map(p => {
                  if (p.id === data.payload.proposalId) {
                    return {
                      ...p,
                      status: data.payload.status,
                      updatedAt: data.payload.updatedAt
                    };
                  }
                  return p;
                }));
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(connectionTimeout);
          setConnectionError("Failed to connect to server. Please try again later.");
          
          if (reconnectAttempts.current === 0) {
            toast({
              title: "Connection Error",
              description: "Failed to connect to the server. Retrying...",
              variant: "destructive"
            });
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket closed');
          clearTimeout(connectionTimeout);
          setIsConnected(false);
          
          // Only show toast if we were previously connected
          if (isConnected) {
            sonnerToast.error("Disconnected from server");
          }
          
          // Try to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff capped at 30s
            
            console.log(`Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              console.log('Attempting to reconnect...');
              if (socketRef.current?.readyState !== WebSocket.OPEN) {
                connectWebSocket();
              }
            }, delay);
          } else {
            console.log('Max reconnection attempts reached');
            setIsLoading(false);
            setConnectionError("Maximum reconnection attempts reached. Please try again later.");
            toast({
              title: "Connection Failed",
              description: "Unable to connect after multiple attempts. Please try again later.",
              variant: "destructive"
            });
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setConnectionError("Failed to create connection. Please try again later.");
        setIsLoading(false);
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, sendMessage, toast]);
  
  // For cleanup and automatic reconnection
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current && currentUser) {
        sendMessage('USER_DISCONNECT', { userId: currentUser.id });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, sendMessage]);
  
  // Functions to interact with the WebSocket API
  const addProposal = useCallback((newProposal: Omit<Proposal, 'id' | 'creatorId' | 'createdAt' | 'comments' | 'votes' | 'transactions' | 'status'>) => {
    if (!currentUser) return;
    sendMessage('ADD_PROPOSAL', { ...newProposal, creatorId: currentUser.id });
  }, [currentUser, sendMessage]);
  
  const addComment = useCallback((proposalId: string, content: string) => {
    if (!currentUser) return;
    
    // Check if user has already commented on this proposal
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;
    
    const hasCommented = proposal.comments.some(c => c.userId === currentUser.id);
    if (hasCommented) {
      toast({
        title: "Comment Error",
        description: "You have already commented on this proposal.",
        variant: "destructive"
      });
      return;
    }
    
    sendMessage('ADD_COMMENT', { proposalId, content, userId: currentUser.id });
  }, [currentUser, proposals, sendMessage, toast]);
  
  const addVote = useCallback((proposalId: string, inFavor: boolean) => {
    if (!currentUser) return;
    sendMessage('ADD_VOTE', { proposalId, inFavor, userId: currentUser.id });
  }, [currentUser, sendMessage]);
  
  const updateProposalStatus = useCallback((proposalId: string, status: 'pending' | 'active' | 'rejected') => {
    if (!currentUser) return;
    sendMessage('UPDATE_PROPOSAL_STATUS', { proposalId, status, userId: currentUser.id });
  }, [currentUser, sendMessage]);
  
  return (
    <WebSocketContext.Provider
      value={{
        proposals,
        activeUsers,
        currentUser,
        isConnected,
        isLoading,
        connectionError,
        addProposal,
        addComment,
        addVote,
        updateProposalStatus,
        retryConnection
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
