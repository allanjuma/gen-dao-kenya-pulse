
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
import { ProposalCard } from '@/components/ProposalCard';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Proposal, ProposalStatus } from '@/types';

const Proposals = () => {
  const { proposals, isLoading } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get status filter from URL or default to 'all'
  const statusFilter = (searchParams.get('status') as ProposalStatus | 'all') || 'all';
  
  // Filter proposals by status and search query
  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Count proposals by status for tab badges
  const proposalCounts = {
    all: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    active: proposals.filter(p => p.status === 'active').length,
    rejected: proposals.filter(p => p.status === 'rejected').length
  };
  
  // Change status filter
  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };
  
  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Comments', value: 'comments' },
    { label: 'Most Votes', value: 'votes' }
  ];
  
  // Sort proposals based on sort option
  const sortProposals = (proposals: Proposal[], sortOption: string): Proposal[] => {
    return [...proposals].sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'comments':
          return b.comments.length - a.comments.length;
        case 'votes':
          return b.votes.length - a.votes.length;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };
  
  // Get sort option from URL or default to 'newest'
  const sortOption = searchParams.get('sort') || 'newest';
  const sortedAndFilteredProposals = sortProposals(filteredProposals, sortOption);
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Proposals</h1>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full md:w-64"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filter proposals</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={sortOption === option.value ? 'bg-muted' : ''}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button asChild>
              <Link to="/proposals/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Create Proposal</span>
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={statusFilter} onValueChange={handleStatusChange}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">
              All
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {proposalCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {proposalCounts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {proposalCounts.active}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
                {proposalCounts.rejected}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={statusFilter} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : sortedAndFilteredProposals.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {sortedAndFilteredProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">No proposals found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'Try changing your search query or filters.' : 'Be the first to create a proposal!'}
                </p>
                <Button asChild>
                  <Link to="/proposals/create">Create Proposal</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Proposals;
