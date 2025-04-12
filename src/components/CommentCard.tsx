
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Comment } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface CommentCardProps {
  comment: Comment;
  userName?: string;
}

export const CommentCard = ({ comment, userName }: CommentCardProps) => {
  return (
    <Card className="animate-slide-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="font-medium">
            {userName || `User ${comment.userId.substring(0, 8)}...`}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p>{comment.content}</p>
      </CardContent>
      <CardFooter className="pt-0">
        {comment.sentiment !== null && (
          <div className="text-xs flex items-center gap-1">
            <span>Sentiment:</span>
            {comment.sentiment ? (
              <span className="text-green-500 flex items-center">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Positive
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <ThumbsDown className="h-3 w-3 mr-1" />
                Negative
              </span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
