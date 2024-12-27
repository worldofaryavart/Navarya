// src/components/email/EmailView.tsx
import { Email } from '@/types/email';
import { format } from 'date-fns';

interface EmailViewProps {
  email: Email;
  onClose: () => void;
}

export default function EmailView({ email, onClose }: EmailViewProps) {
  const senderName = email.from.split('<')[0].trim();
  const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{email.subject}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">From: </span>
            <span className="text-sm">{senderName}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> {`<${senderEmail}>`}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Date: </span>
            <span className="text-sm">
              {format(new Date(email.timestamp), 'PPpp')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div className="prose dark:prose-invert max-w-none">
          {email.body}
        </div>
      </div>
    </div>
  );
}