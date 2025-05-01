
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Proposal } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface ProposalCardProps {
  proposal: Proposal;
}

export const ProposalCard = ({ proposal }: ProposalCardProps) => {
  const { currentUser, addVote } = useWebSocket();
  
  const statusIcons = {
    pending: <Clock className="h-5 w-5 text-yellow-500" />,
    active: <CheckCircle className="h-5 w-5 text-green-500" />,
    rejected: <AlertCircle className="h-5 w-5 text-red-500" />
  };
  
  const statusLabels = {
    pending: 'Pending',
    active: 'Active',
    rejected: 'Rejected'
  };
  
  const totalVotes = proposal.votes.length;
  const favorVotes = proposal.votes.filter(v => v.inFavor).length;
  const againstVotes = totalVotes - favorVotes;
  const favorPercentage = totalVotes === 0 ? 0 : Math.round((favorVotes / totalVotes) * 100);
  
  const userVote = currentUser 
    ? proposal.votes.find(v => v.userId === currentUser.id)
    : null;
  
  const handleVote = (inFavor: boolean) => {
    addVote(proposal.id, inFavor);
  };
  
  return (
    <Card className="w-full hover:shadow-md transition-shadow animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">
            <Link to={`/proposals/${proposal.id}`} className="hover:text-primary transition-colors">
              {proposal.title}
            </Link>
          </CardTitle>
          <Badge variant={proposal.status === 'rejected' ? 'destructive' : proposal.status === 'active' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {statusIcons[proposal.status]}
            {statusLabels[proposal.status]}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Created {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 mb-4">{proposal.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{proposal.comments.length} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{favorVotes} in favor</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4" />
            <span>{againstVotes} against</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>In favor ({favorPercentage}%)</span>
            <span>Against ({100 - favorPercentage}%)</span>
          </div>
          <Progress value={favorPercentage} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2 justify-between">
        <Link to={`/proposals/${proposal.id}`} className="w-full">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
        {proposal.status === 'active' && currentUser && (
          <div className="flex gap-2">
            <Button 
              variant={userVote?.inFavor ? "default" : "outline"} 
              size="icon"
              onClick={() => handleVote(true)}
            >
              <ThumbsUp className="h-5 w-5" />
            </Button>
            <Button 
              variant={userVote?.inFavor === false ? "destructive" : "outline"} 
              size="icon"
              onClick={() => handleVote(false)}
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
