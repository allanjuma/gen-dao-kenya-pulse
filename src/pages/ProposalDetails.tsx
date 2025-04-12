
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Phone, 
  ThumbsDown, 
  ThumbsUp, 
  Users 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Layout } from '@/components/Layout';
import { CommentCard } from '@/components/CommentCard';
import { CommentForm } from '@/components/CommentForm';
import { TransactionsTable } from '@/components/TransactionsTable';
import { useWebSocket } from '@/contexts/WebSocketContext';

const ProposalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proposals, currentUser, activeUsers, addVote, updateProposalStatus } = useWebSocket();
  const [tab, setTab] = useState('details');
  
  const proposal = useMemo(() => {
    return proposals.find(p => p.id === id);
  }, [proposals, id]);
  
  if (!proposal) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mb-6">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/proposals')}>
            Back to Proposals
          </Button>
        </div>
      </Layout>
    );
  }
  
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
  
  // Check if proposal meets requirements for activation
  const uniqueCommentUsers = new Set(proposal.comments.map(c => c.userId)).size;
  const totalUniqueUsers = activeUsers.length;
  const meetsCommentThreshold = totalUniqueUsers > 0 && uniqueCommentUsers > totalUniqueUsers * 0.5;
  const isUserFirstUser = currentUser?.isFirstUser === true;
  
  // Check if proposal should be rejected (more than 50% voted against)
  const shouldReject = totalUniqueUsers > 0 && 
                      againstVotes > 0 && 
                      againstVotes / totalVotes > 0.5;
  
  const isCreator = currentUser?.id === proposal.creatorId;
  
  // Format treasury email for active proposals
  const treasuryEmail = proposal.status === 'active' 
    ? `${proposal.treasuryPhone}@domain.com` 
    : null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center gap-2"
          onClick={() => navigate('/proposals')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposals
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{proposal.title}</h1>
              <Badge variant={proposal.status === 'rejected' ? 'destructive' : proposal.status === 'active' ? 'default' : 'secondary'} className="flex items-center gap-1">
                {statusIcons[proposal.status]}
                {statusLabels[proposal.status]}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Created {format(new Date(proposal.createdAt), 'PPP')} • 
              {proposal.updatedAt && 
                ` Updated ${format(new Date(proposal.updatedAt), 'PPP')} • `
              }
              {proposal.comments.length} comments • {proposal.votes.length} votes
            </div>
          </div>
          
          {isUserFirstUser && proposal.status === 'pending' && meetsCommentThreshold && (
            <Button
              onClick={() => updateProposalStatus(proposal.id, 'active')}
            >
              Activate Proposal
            </Button>
          )}
          
          {isUserFirstUser && proposal.status === 'active' && shouldReject && (
            <Button
              variant="destructive"
              onClick={() => updateProposalStatus(proposal.id, 'rejected')}
            >
              Reject Proposal
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                    {proposal.comments.length}
                  </span>
                </TabsTrigger>
                {proposal.status === 'active' && (
                  <TabsTrigger value="transactions">
                    Transactions
                    <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                      {proposal.transactions.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="mt-0">
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap">{proposal.description}</p>
                    
                    {treasuryEmail && (
                      <div className="mt-6 flex items-center gap-2 p-4 bg-muted rounded-md">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Treasury Contact</div>
                          <div className="text-sm text-muted-foreground">{treasuryEmail}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comments" className="mt-0">
                <div className="space-y-6">
                  {proposal.comments.length > 0 ? (
                    <div className="space-y-4">
                      {proposal.comments.map((comment) => (
                        <CommentCard 
                          key={comment.id} 
                          comment={comment} 
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No comments yet. Be the first to comment!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {currentUser && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Comment</CardTitle>
                        <CardDescription>
                          Share your thoughts about this proposal. Each user can post one comment (max 500 characters).
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CommentForm proposalId={proposal.id} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Treasury Transactions</CardTitle>
                    <CardDescription>
                      All financial transactions related to this proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionsTable transactions={proposal.transactions} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting</CardTitle>
                {proposal.status === 'active' ? (
                  <CardDescription>
                    Cast your vote for this proposal
                  </CardDescription>
                ) : (
                  <CardDescription>
                    Voting will be enabled once the proposal is active
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>In favor ({favorVotes})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4" />
                        <span>Against ({againstVotes})</span>
                      </div>
                    </div>
                    <Progress value={favorPercentage} className="h-2" />
                  </div>
                  
                  {proposal.status === 'active' && currentUser && (
                    <div className="flex justify-between gap-2">
                      <Button 
                        variant={userVote?.inFavor ? "default" : "outline"} 
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => handleVote(true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        In Favor
                      </Button>
                      <Button 
                        variant={userVote?.inFavor === false ? "destructive" : "outline"}
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => handleVote(false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Against
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Proposal Status</CardTitle>
                <CardDescription>
                  Current state and requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={proposal.status === 'rejected' ? 'destructive' : proposal.status === 'active' ? 'default' : 'secondary'} className="flex items-center gap-1">
                      {statusIcons[proposal.status]}
                      {statusLabels[proposal.status]}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="text-sm font-medium">Requirements for Activation</span>
                    
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span>Comments from 50% of users</span>
                        </div>
                        <Badge variant={meetsCommentThreshold ? "default" : "outline"}>
                          {uniqueCommentUsers}/{Math.ceil(totalUniqueUsers * 0.5)} users
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProposalDetails;
