import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmailContentRenderer from './EmailContentRenderer';

interface PreviewEmailProps {
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp?: Date;
  onClose: () => void;
}

const PreviewEmail: React.FC<PreviewEmailProps> = ({
  from,
  to,
  subject,
  body,
  timestamp = new Date(),
  onClose
}) => {
  const senderName = from.split('<')[0].trim();
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Preview Header */}
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Email Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Email Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-4">{subject}</h1>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{senderName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  To: {to.join(', ')}
                </div>
                <div className="text-sm text-gray-500">
                  {format(timestamp, 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="prose dark:prose-invert max-w-none">
            <EmailContentRenderer 
              content={body}
              className="email-container"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewEmail;
