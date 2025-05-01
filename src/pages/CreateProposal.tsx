
import { Layout } from '@/components/Layout';
import { CreateProposalForm } from '@/components/CreateProposalForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CreateProposal = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create a New Proposal</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Fill in the details of your proposal. Be clear and specific about what you're proposing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateProposalForm />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Guidelines</CardTitle>
                <CardDescription>
                  Follow these tips to create an effective proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex flex-col">
                    <span className="font-medium">Be Clear and Concise</span>
                    <span className="text-sm text-muted-foreground">
                      State your proposal clearly and avoid unnecessary details.
                    </span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium">Define the Impact</span>
                    <span className="text-sm text-muted-foreground">
                      Explain how your proposal will benefit the community.
                    </span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium">Include Implementation Details</span>
                    <span className="text-sm text-muted-foreground">
                      Outline how your proposal will be implemented if approved.
                    </span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium">Set Realistic Timelines</span>
                    <span className="text-sm text-muted-foreground">
                      Include reasonable timeframes for implementation.
                    </span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium">Treasury Phone Number</span>
                    <span className="text-sm text-muted-foreground">
                      Enter a valid phone number in international format (e.g., +254712345678).
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProposal;
