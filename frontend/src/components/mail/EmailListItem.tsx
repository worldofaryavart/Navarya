// src/components/email/EmailListItem.tsx
import { Email } from '@/types/email';
import { formatDistanceToNow } from 'date-fns';

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

export default function EmailListItem({ email, onClick }: EmailListItemProps) {
  const senderName = email.from.split('<')[0].trim();
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
        !email.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {senderName}
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
            {email.subject}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {email.body.substring(0, 100)}...
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
          {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}