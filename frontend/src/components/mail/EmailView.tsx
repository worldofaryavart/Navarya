// src/components/email/EmailView.tsx
import { Email } from '@/types/mailTypes';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star, Reply, MoreVertical, Download, Trash, Forward } from 'lucide-react';

interface EmailViewProps {
  email: Email;
  onClose: () => void;
}

export default function EmailView({ email, onClose }: EmailViewProps) {
  const senderName = email.from.split('<')[0].trim();
  const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b dark:border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="md:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold flex-1 truncate">{email.subject}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Star className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-6">
          {/* Sender Info */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-10 w-10">
              <AvatarImage src={email.senderAvatar} alt={senderName} />
              <AvatarFallback className="bg-purple-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-base">{senderName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {`<${senderEmail}>`}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(email.timestamp), 'PPpp')}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                to {email.to.join(', ')}
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="prose dark:prose-invert max-w-none">
            {/* Handle HTML content safely */}
            <div dangerouslySetInnerHTML={{ __html: email.body }} />
            
            {/* Attachments if any */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="mt-6 border-t dark:border-gray-800 pt-6">
                <h4 className="text-sm font-medium mb-3">Attachments</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {email.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.size}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t dark:border-gray-800 flex items-center gap-2">
        <Button variant="secondary" className="gap-2">
          <Reply className="h-4 w-4" /> Reply
        </Button>
        <Button variant="secondary" className="gap-2">
          <Forward className="h-4 w-4" /> Forward
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon">
          <Trash className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}