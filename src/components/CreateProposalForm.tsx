
import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "radix-ui/react-icons"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }).max(100, { message: 'Title must be less than 100 characters' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters long' }).max(1000, { message: 'Description must be less than 1000 characters' }),
  treasuryPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in international format (e.g., +254712345678)' }),
  proposerFirstName: z.string().min(1, { message: 'Proposer first name is required' }),
  proposerLastName: z.string().min(1, { message: 'Proposer last name is required' }),
  expiryDate: z.date().min(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), { message: 'Expiry date must be at least 2 days from now' }).max(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), { message: 'Expiry date must be within 30 days from now' }),
  proposalAmount: z.number().int().min(10, { message: 'Proposal amount must be greater than 10' }).max(100000, { message: 'Proposal amount must be less than 100,000' }),
});

type FormValues = z.infer<typeof formSchema>;

export const CreateProposalForm = () => {
  const { addProposal } = useWebSocket();
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      treasuryPhone: '+254',
      proposerFirstName: '',
      proposerLastName: '',
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      proposalAmount: 100,
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      await addProposal({
        title: values.title,
        description: values.description,
        treasuryPhone: values.treasuryPhone,
        updatedAt: null,
        proposerFirstName: values.proposerFirstName,
        proposerLastName: values.proposerLastName,
        expiryDate: values.expiryDate.toISOString(), // Convert to ISO string for transmission
        proposalAmount: values.proposalAmount,
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

        <FormField
          control={form.control}
          name="proposerFirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposer First Name</FormLabel>
              <FormControl>
                <Input placeholder="First Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proposerLastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposer Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Last Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Proposal Expiry Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ||
                      date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proposalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposal Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Amount (10-100,000)"
                  {...field}
                />
              </FormControl>
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
