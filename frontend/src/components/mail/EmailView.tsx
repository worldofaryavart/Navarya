// src/components/email/EmailView.tsx
import { Email } from '@/types/mailTypes';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star, Reply, MoreVertical, Download, Trash, Forward, Mail, FileText, Calendar, Link } from 'lucide-react';
import EmailContentRenderer from './EmailContentRenderer';
import { isJobAlertEmail, formatJobAlertEmail } from '@/utils/emailContentFormatter';

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

  console.log("selected mail body is : ", email.body);
  // Function to render different types of content
  const renderEmailContent = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <EmailContentRenderer 
          content={email.body}
          className="email-container mx-auto w-full max-w-[800px] px-4 py-6"
        />
      </div>
    );
  };

  const handleDownload = async (attachment: any) => {
    try {
      const response = await fetch(`/api/mail/attachment/${email.id}/${attachment.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      // You might want to show a toast notification here
    }
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
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        {renderEmailContent()}

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mx-auto max-w-[800px] px-4 py-6 space-y-4">
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}