// src/components/email/EmailView.tsx
import { Email } from '@/types/mailTypes';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star, Reply, MoreVertical, Download, Trash, Forward, Mail, FileText, Calendar, Link } from 'lucide-react';
import EmailContentRenderer from './EmailContentRenderer';

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

  console.log("email boday is : ", email.body);
  // Function to render different types of content
  const renderEmailContent = () => {
    // Check if content appears to be an invoice/receipt
    if (email.subject.toLowerCase().includes('receipt') || email.subject.toLowerCase().includes('invoice')) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          {/* Receipt Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Receipt from {senderName}</h3>
              <p className="text-sm text-gray-500">Receipt #{email.subject.split('#')[1]}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{format(new Date(email.timestamp), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Structured Content */}
          <div className="space-y-4">
            <EmailContentRenderer 
              content={email.body}
              className="[&_table]:border-separate [&_table]:border-spacing-2"
            />
          </div>
        </div>
      );
    }

    // Regular email content
    return (
      <div className="prose dark:prose-invert max-w-none">
        <EmailContentRenderer 
          content={email.body}
          className="px-6 py-4"
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Email Header - Fixed */}
      <div className="flex-none p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold truncate flex-1">{email.subject}</h1>
        </div>

        {/* Sender Info and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={email.senderAvatar} alt={senderName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold truncate">{senderName}</h2>
                <span className="text-sm text-gray-500">
                  {format(new Date(email.timestamp), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                To: {email.to.join(', ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon">
              <Star className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Reply className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Forward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400">
              <Trash className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4 max-w-[900px] mx-auto">
          {/* Main Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            {renderEmailContent()}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Attachments ({email.attachments.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {email.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      {attachment.type === 'document' ? (
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : attachment.type === 'calendar' ? (
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Link className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{attachment.size}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
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
  );
}