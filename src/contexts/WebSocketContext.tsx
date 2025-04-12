
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Proposal, User, WebSocketMessage } from '@/types';
import { useToast } from '@/components/ui/use-toast';

// Use environment variable or fallback for WebSocket URL
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://api.gendao.co/ws';

interface WebSocketContextType {
  proposals: Proposal[];
  activeUsers: User[];
  currentUser: User | null;
  isConnected: boolean;
  isLoading: boolean;
  addProposal: (proposal: Omit<Proposal, 'id' | 'creatorId' | 'createdAt' | 'comments' | 'votes' | 'transactions' | 'status'>) => void;
  addComment: (proposalId: string, content: string) => void;
  addVote: (proposalId: string, inFavor: boolean) => void;
  updateProposalStatus: (proposalId: string, status: 'pending' | 'active' | 'rejected') => void;
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
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  
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
        description: "Not connected to server. Please refresh and try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Connect to WebSocket server
  useEffect(() => {
    setIsLoading(true);
    const userId = getUserId();
    
    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;
      setSocket(ws);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Register user with server
        sendMessage('REGISTER_USER', { userId });
      };
      
      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('Received message:', data);
          
          switch (data.type) {
            case 'INITIAL_DATA':
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
        toast({
          title: "Connection Error",
          description: "Failed to connect to the server. Please try again later.",
          variant: "destructive"
        });
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }
        }, 3000);
      };
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [toast]);
  
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
        addProposal,
        addComment,
        addVote,
        updateProposalStatus
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
