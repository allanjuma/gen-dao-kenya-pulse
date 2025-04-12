
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { ProposalCard } from '@/components/ProposalCard';

const Index = () => {
  const { proposals, isLoading } = useWebSocket();
  
  // Get the most recent proposals (up to 3)
  const recentProposals = proposals.slice(0, 3);
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-kenya-black to-background py-16 md:py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Empowering Kenyan Communities Through Collective Decisions
              </h1>
              <p className="text-lg mb-8 text-gray-300">
                genDAO Kenya Pulse is a platform for transparent, inclusive decision-making. Create proposals, vote on initiatives, and make a difference together.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link to="/proposals">View Proposals</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/proposals/create">Create Proposal</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-md aspect-square bg-kenya-white p-6 rounded-full border-8 border-kenya-red shadow-2xl">
                <div className="w-full h-full rounded-full bg-kenya-green flex items-center justify-center">
                  <img 
                    src="/src/assets/kenya-coat-of-arms.svg" 
                    alt="Kenya Coat of Arms" 
                    className="w-3/4 h-3/4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-kenya-red mb-4" />
                <CardTitle>Real-Time Voting</CardTitle>
                <CardDescription>
                  Vote on proposals instantly with immediate results visible to all community members.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-kenya-green mb-4" />
                <CardTitle>Transparent Governance</CardTitle>
                <CardDescription>
                  All proposals, discussions, and treasury transactions are visible to everyone.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-kenya-black mb-4" />
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track proposal performance, user engagement, and treasury activity in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Recent Proposals Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Proposals</h2>
            <Button asChild variant="outline">
              <Link to="/proposals" className="flex items-center gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="w-full">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-1/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-4/5"></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-10 bg-muted rounded animate-pulse w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : recentProposals.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {recentProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Proposals Yet</CardTitle>
                <CardDescription>
                  Be the first to create a proposal for the community!
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/proposals/create">Create Proposal</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
