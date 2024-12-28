'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Email, EmailFolder, EmailLabel } from '@/types/mailTypes';
import { Loader2, Search, Plus, Inbox, Send, Archive, Trash, Tag, Star } from 'lucide-react';
import { getEmails, markAsRead } from '@/utils/mailService';
import ComposeEmail from '@/components/mail/ComposeEmail';
import EmailList from '@/components/mail/EmailList';
import EmailView from '@/components/mail/EmailView';

const defaultFolders: EmailFolder[] = [
  { id: 'inbox', name: 'Inbox', type: 'inbox', unreadCount: 0 },
  { id: 'sent', name: 'Sent', type: 'sent', unreadCount: 0 },
  { id: 'drafts', name: 'Drafts', type: 'drafts', unreadCount: 0 },
  { id: 'trash', name: 'Trash', type: 'trash', unreadCount: 0 },
];

const defaultLabels: EmailLabel[] = [
  { id: 'important', name: 'Important', color: '#FF4444' },
  { id: 'work', name: 'Work', color: '#4444FF' },
  { id: 'personal', name: 'Personal', color: '#44FF44' },
];

const MailAgent = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>(defaultFolders);
  const [labels] = useState<EmailLabel[]>(defaultLabels);
  const [currentFolder, setCurrentFolder] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCompose, setShowCompose] = useState(false);

  console.log("emails are : ", emails);

  useEffect(() => {
    const loadEmails = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedEmails = await getEmails(currentFolder);
        console.log('fetchedEmails: ', fetchedEmails);
        setEmails(fetchedEmails);

        // Update unread count
        const unreadCount = fetchedEmails.filter(email => !email.read).length;
        const updatedFolders = folders.map(folder =>
          folder.id === currentFolder
            ? { ...folder, unreadCount }
            : folder
        );
        setFolders(updatedFolders);
      } catch (error: any) {
        console.error('Error loading emails:', error);
        setError(error.message || 'Failed to load emails');
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadEmails();
    }
  }, [user, currentFolder]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filter emails locally for now
    // TODO: Implement server-side search
  };

  const handleComposeClick = () => {
    setShowCompose(true);
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      try {
        await markAsRead(email.id);
        // Update email in state
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.id === email.id ? { ...e, read: true } : e
          )
        );
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-gray-800/50 border-r border-gray-700 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-4">
            <button
              onClick={handleComposeClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <Plus size={20} />
              Compose
            </button>
          </div>

          <div className="mt-4">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setCurrentFolder(folder.id)}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors duration-200 ${currentFolder === folder.id
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'hover:bg-gray-700/50'
                  }`}
              >
                {folder.type === 'inbox' && <Inbox size={20} />}
                {folder.type === 'sent' && <Send size={20} />}
                {folder.type === 'drafts' && <Archive size={20} />}
                {folder.type === 'trash' && <Trash size={20} />}
                <span className="truncate">{folder.name}</span>
                {folder.unreadCount > 0 && (
                  <span className="ml-auto flex-shrink-0 bg-purple-600 text-white text-xs rounded-full px-2">
                    {folder.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 px-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Labels</h3>
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-700/50 px-2 rounded transition-colors duration-200"
              >
                <Tag size={16} style={{ color: label.color }} />
                <span className="truncate">{label.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-[400px] flex-shrink-0 border-r border-gray-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={32} />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                {error}
              </div>
            ) : (
              // <div className="flex-1 overflow-y-auto">
                <EmailList
                  emails={emails}
                  onEmailSelect={handleEmailClick}
                />
              // </div>
            )}
          </div>

          {/* Email View */}
          <div className="flex-1 overflow-hidden ">
            {selectedEmail ? (
              <EmailView
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Select an email to view</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose Email Modal */}
        {showCompose && (
          <ComposeEmail
            onClose={() => setShowCompose(false)}
            replyToEmail={selectedEmail?.id}
          />
        )}
      </div>
    </div>
  );
};

export default MailAgent;