
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  ThumbsDown, 
  ThumbsUp, 
  UserCheck, 
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Layout } from '@/components/Layout';
import { useWebSocket } from '@/contexts/WebSocketContext';

const Dashboard = () => {
  const { currentUser, activeUsers, proposals, updateProposalStatus } = useWebSocket();
  const navigate = useNavigate();
  
  // Redirect if not the first user
  useEffect(() => {
    if (currentUser && !currentUser.isFirstUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  if (!currentUser || !currentUser.isFirstUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            Only the dashboard admin can access this page.
          </p>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </Layout>
    );
  }
  
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const activeProposals = proposals.filter(p => p.status === 'active');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');
  
  const totalComments = proposals.reduce((sum, p) => sum + p.comments.length, 0);
  const totalVotes = proposals.reduce((sum, p) => sum + p.votes.length, 0);
  
  // Check which proposals meet activation requirements
  const getEligibleProposals = () => {
    return pendingProposals.filter(p => {
      const uniqueCommentUsers = new Set(p.comments.map(c => c.userId)).size;
      const totalUniqueUsers = activeUsers.length;
      return totalUniqueUsers > 0 && uniqueCommentUsers > totalUniqueUsers * 0.5;
    });
  };
  
  // Check which proposals should be rejected (more than 50% voted against)
  const getRejectableProposals = () => {
    return activeProposals.filter(p => {
      const totalVotes = p.votes.length;
      const againstVotes = p.votes.filter(v => !v.inFavor).length;
      return totalVotes > 0 && againstVotes / totalVotes > 0.5;
    });
  };
  
  const eligibleProposals = getEligibleProposals();
  const rejectableProposals = getRejectableProposals();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{activeUsers.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{proposals.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{totalComments}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <ThumbsUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{totalVotes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-60">
                {/* Mock chart - would use Recharts in a real implementation */}
                <div className="absolute inset-0 flex items-center justify-around p-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xl font-bold">
                      {pendingProposals.length}
                    </div>
                    <span className="font-medium">Pending</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                      {activeProposals.length}
                    </div>
                    <span className="font-medium">Active</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-white text-xl font-bold">
                      {rejectedProposals.length}
                    </div>
                    <span className="font-medium">Rejected</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>
                Users currently connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-4">
                {activeUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {index === 0 ? 'User ' + user.id.substring(0, 6) + '... (Admin)' : 'User ' + user.id.substring(0, 6) + '...'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(user.lastActive), 'HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="eligible">
          <TabsList className="mb-6">
            <TabsTrigger value="eligible">
              Eligible for Activation
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {eligibleProposals.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejectable">
              Eligible for Rejection
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {rejectableProposals.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all">
              All Proposals
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {proposals.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="eligible" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Proposals Eligible for Activation</CardTitle>
                <CardDescription>
                  These proposals have received enough comments to be activated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eligibleProposals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligibleProposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">{proposal.title}</TableCell>
                          <TableCell>{format(new Date(proposal.createdAt), 'PPP')}</TableCell>
                          <TableCell>{proposal.comments.length}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              onClick={() => updateProposalStatus(proposal.id, 'active')}
                            >
                              Activate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No proposals are eligible for activation yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rejectable" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Proposals Eligible for Rejection</CardTitle>
                <CardDescription>
                  These proposals have been voted against by more than 50% of voters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rejectableProposals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Votes Against</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectableProposals.map((proposal) => {
                        const totalVotes = proposal.votes.length;
                        const againstVotes = proposal.votes.filter(v => !v.inFavor).length;
                        const againstPercentage = Math.round((againstVotes / totalVotes) * 100);
                        
                        return (
                          <TableRow key={proposal.id}>
                            <TableCell className="font-medium">{proposal.title}</TableCell>
                            <TableCell>{format(new Date(proposal.createdAt), 'PPP')}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{againstVotes}/{totalVotes} ({againstPercentage}%)</span>
                                <Progress value={againstPercentage} className="h-2 w-20" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProposalStatus(proposal.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <ThumbsUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No proposals are eligible for rejection right now.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>All Proposals</CardTitle>
                <CardDescription>
                  Complete list of all proposals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {proposals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Votes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => {
                        const favorVotes = proposal.votes.filter(v => v.inFavor).length;
                        const againstVotes = proposal.votes.length - favorVotes;
                        
                        return (
                          <TableRow key={proposal.id}>
                            <TableCell className="font-medium">{proposal.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {proposal.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                                {proposal.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {proposal.status === 'rejected' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                <span className="capitalize">{proposal.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(proposal.createdAt), 'PPP')}</TableCell>
                            <TableCell>{proposal.comments.length}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4 text-green-500" />
                                <span>{favorVotes}</span>
                                <ThumbsDown className="h-4 w-4 text-red-500 ml-2" />
                                <span>{againstVotes}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No proposals have been created yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
