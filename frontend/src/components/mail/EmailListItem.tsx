// src/components/email/EmailListItem.tsx
import { Email } from '@/types/mailTypes';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

export default function EmailListItem({ email, onClick }: EmailListItemProps) {
  const senderName = email.from.split('<')[0].trim();
  const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Clean the email body of code and styling
  const cleanBody = email.body
    // Remove style tags and their contents
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove script tags and their contents
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove CSS-like content
    .replace(/\{[^}]+\}/g, '')
    // Remove @media queries
    .replace(/@media[^{]+\{([^}]+\})+/g, '')
    // Remove common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Remove multiple spaces and clean up
    .replace(/\s+/g, ' ')
    // Remove any remaining CSS properties
    .replace(/[a-z-]+:[^;]+;/g, '')
    // Remove any remaining special characters and cleanup
    .replace(/[^\w\s.,!?@-]/g, ' ')
    .trim();
  
  return (
    <div 
      onClick={onClick}
      className={`py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 ${
        !email.read ? 'bg-blue-50/10 dark:bg-blue-900/10 font-medium' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={email.senderAvatar} alt={senderName} />
          <AvatarFallback className="bg-purple-600 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {senderName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
            {email.subject}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {cleanBody.substring(0, 100)}
          </p>
        </div>
      </div>
    </div>
  );
}