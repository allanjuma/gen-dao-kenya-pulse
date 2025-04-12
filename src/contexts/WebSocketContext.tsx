
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Proposal, User, WebSocketMessage } from '@/types';
import { useToast } from '@/components/ui/use-toast';

// Mock WebSocket URL - in a real app this would be replaced
const WS_URL = 'wss://mock-websocket-server.com/api';

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

// Mock function to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock function to generate user ID (in a real app this would be more robust)
const generateUserId = () => {
  const storedUserId = localStorage.getItem('gendao-user-id');
  if (storedUserId) return storedUserId;
  
  const newUserId = `user-${generateId()}`;
  localStorage.setItem('gendao-user-id', newUserId);
  return newUserId;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Mock WebSocket connection
  useEffect(() => {
    setIsLoading(true);
    
    // In a real app, we would establish a WebSocket connection
    // For now, we'll mock this behavior with a timeout
    const timer = setTimeout(() => {
      // Generate mock user
      const userId = generateUserId();
      const mockUser: User = {
        id: userId,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isFirstUser: false, // Will be updated when we receive user list
      };
      
      setCurrentUser(mockUser);
      
      // Start with empty proposals and users
      // This simulates connecting to the server and getting initial empty state
      setActiveUsers([mockUser]);
      
      // Update isFirstUser flag for the first user
      if (activeUsers.length === 1) {
        setActiveUsers(users => {
          if (users.length > 0) {
            const updatedUsers = [...users];
            updatedUsers[0].isFirstUser = true;
            return updatedUsers;
          }
          return users;
        });
      }
      
      setIsConnected(true);
      setIsLoading(false);
      
      toast({
        title: "Connected to genDAO",
        description: "You're now connected to the community",
      });
      
      // Simulate getting new users over time (in a real app, this would come from WebSocket events)
      const userInterval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance to add a new user
          const newUserId = `user-${generateId()}`;
          const newUser: User = {
            id: newUserId,
            joinedAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            isFirstUser: false,
          };
          
          setActiveUsers(prevUsers => {
            const updatedUsers = [...prevUsers, newUser];
            // Sort users by join time
            updatedUsers.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
            // Update isFirstUser flag for the first user
            if (updatedUsers.length > 0) {
              updatedUsers.forEach(user => user.isFirstUser = false);
              updatedUsers[0].isFirstUser = true;
            }
            return updatedUsers;
          });
          
          // 10% chance to add a sample proposal with the new user
          if (Math.random() > 0.9) {
            const sampleProposal: Proposal = {
              id: `proposal-${generateId()}`,
              title: `Sample Proposal by ${newUserId.substring(0, 8)}`,
              description: 'This is an automatically generated proposal to demonstrate real-time updates.',
              creatorId: newUserId,
              treasuryPhone: '+254712345678',
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: null,
              comments: [],
              votes: [],
              transactions: []
            };
            
            setProposals(prevProposals => [...prevProposals, sampleProposal]);
          }
        }
      }, 10000); // Try to add a new user every 10 seconds
      
      return () => {
        clearInterval(userInterval);
      };
    }, 1500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [toast]);
  
  // In a real app, we would send messages through the WebSocket
  // For now, we'll mock these functions
  const addProposal = (newProposal: Omit<Proposal, 'id' | 'creatorId' | 'createdAt' | 'comments' | 'votes' | 'transactions' | 'status'>) => {
    if (!currentUser) return;
    
    const proposal: Proposal = {
      id: `proposal-${generateId()}`,
      ...newProposal,
      creatorId: currentUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      comments: [],
      votes: [],
      transactions: []
    };
    
    setProposals(prev => [proposal, ...prev]);
    
    toast({
      title: "Proposal Created",
      description: "Your proposal has been submitted successfully.",
    });
  };
  
  const addComment = (proposalId: string, content: string) => {
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
    
    const comment = {
      id: `comment-${generateId()}`,
      userId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      sentiment: Math.random() > 0.3 // Mock sentiment with 70% chance of positive
    };
    
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          comments: [...p.comments, comment]
        };
      }
      return p;
    }));
    
    toast({
      title: "Comment Added",
      description: "Your comment has been added to the proposal.",
    });
  };
  
  const addVote = (proposalId: string, inFavor: boolean) => {
    if (!currentUser) return;
    
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        // Remove existing vote from this user if it exists
        const filteredVotes = p.votes.filter(v => v.userId !== currentUser.id);
        
        // Add the new vote
        return {
          ...p,
          votes: [...filteredVotes, { userId: currentUser.id, inFavor }]
        };
      }
      return p;
    }));
    
    toast({
      title: "Vote Recorded",
      description: `You voted ${inFavor ? 'in favor of' : 'against'} the proposal.`,
    });
  };
  
  const updateProposalStatus = (proposalId: string, status: 'pending' | 'active' | 'rejected') => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    
    toast({
      title: "Status Updated",
      description: `Proposal status changed to ${status}.`,
    });
  };
  
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
