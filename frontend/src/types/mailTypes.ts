export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  timestamp: Date;
  read: boolean;
  important: boolean;
  labels: string[];
  attachments?: EmailAttachment[];
  threadId?: string;
  senderAvatar?: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  emails: Email[];
  lastUpdated: Date;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom';
  unreadCount: number;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  meetingLink?: string;
  relatedEmailId?: string;
}

export interface EmailDraft {
  id?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}
