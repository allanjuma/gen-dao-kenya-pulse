
export interface User {
  id: string;
  joinedAt: string;
  lastActive: string;
  isFirstUser: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  sentiment: boolean | null;
}

export interface Vote {
  userId: string;
  inFavor: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  confirmations: number;
  label: string;
  createdAt: string;
}

export type ProposalStatus = 'pending' | 'active' | 'rejected';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  treasuryPhone: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string | null;
  comments: Comment[];
  votes: Vote[];
  transactions: Transaction[];
}

export interface WebSocketMessage {
  type: 'proposals' | 'users' | 'newProposal' | 'newComment' | 'newVote' | 'statusChange';
  data: any;
}
