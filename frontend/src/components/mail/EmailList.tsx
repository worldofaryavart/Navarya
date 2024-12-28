// src/components/email/EmailList.tsx
import { Email } from '@/types/mailTypes';
import EmailListItem from './EmailListItem';

interface EmailListProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
}

export default function EmailList({ emails, onEmailSelect }: EmailListProps) {
  return (
    <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="divide-y divide-gray-700">
        {emails.map((email) => (
          <EmailListItem 
            key={email.id} 
            email={email} 
            onClick={() => onEmailSelect(email)}
          />
        ))}
      </div>
    </div>
  );
}