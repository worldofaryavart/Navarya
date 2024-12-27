// src/components/email/EmailList.tsx
import { Email } from '@/types/email';
import EmailListItem from './EmailListItem';

interface EmailListProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
}

export default function EmailList({ emails, onEmailSelect }: EmailListProps) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {emails.map((email) => (
        <EmailListItem 
          key={email.id} 
          email={email} 
          onClick={() => onEmailSelect(email)}
        />
      ))}
    </div>
  );
}