
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/contexts/WebSocketContext';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }).max(100, { message: 'Title must be less than 100 characters' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters long' }).max(1000, { message: 'Description must be less than 1000 characters' }),
  treasuryPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in international format (e.g., +254712345678)' })
});

type FormValues = z.infer<typeof formSchema>;

export const CreateProposalForm = () => {
  const { addProposal } = useWebSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      treasuryPhone: '+254'
    }
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      await addProposal({
        title: values.title,
        description: values.description,
        treasuryPhone: values.treasuryPhone,
        updatedAt: null // Adding the missing updatedAt property
      });
      
      form.reset();
    } catch (error) {
      console.error('Failed to create proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Proposal title" {...field} />
              </FormControl>
              <FormDescription>
                Give your proposal a clear, concise title.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your proposal in detail..." 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Explain the purpose, benefits, and implementation details of your proposal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="treasuryPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treasury Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+254712345678" {...field} />
              </FormControl>
              <FormDescription>
                Enter a phone number in international format for the proposal's treasury.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Proposal'}
        </Button>
      </form>
    </Form>
  );
};
