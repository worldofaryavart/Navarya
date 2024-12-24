'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Email, EmailFolder, EmailLabel } from '@/types/mailTypes';
import { Loader2, Search, Plus, Inbox, Send, Archive, Trash, Tag, Star } from 'lucide-react';
import { getEmails, markAsRead } from '@/utils/mailService';
import ComposeEmail from '@/components/mail/ComposeEmail';

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
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700">
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
                className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors duration-200 ${
                  currentFolder === folder.id 
                    ? 'bg-purple-600/20 text-purple-400' 
                    : 'hover:bg-gray-700/50'
                }`}
              >
                {folder.type === 'inbox' && <Inbox size={20} />}
                {folder.type === 'sent' && <Send size={20} />}
                {folder.type === 'drafts' && <Archive size={20} />}
                {folder.type === 'trash' && <Trash size={20} />}
                {folder.name}
                {folder.unreadCount > 0 && (
                  <span className="ml-auto bg-purple-600 text-white text-xs rounded-full px-2">
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
                {label.name}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="bg-gray-800/50 border-b border-gray-700 p-4">
            <div className="max-w-xl flex items-center gap-2 bg-gray-700/50 rounded-lg px-4 py-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Email List and Content */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {error}
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* Email List */}
              <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors duration-200 ${
                      selectedEmail?.id === email.id ? 'bg-gray-700/50' : ''
                    } ${!email.read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {email.important && <Star size={16} className="text-yellow-400" />}
                      <span className="font-semibold">{email.from}</span>
                      <span className="ml-auto text-sm text-gray-400">
                        {formatDate(email.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-1">{email.subject}</div>
                    <div className="text-sm text-gray-400 mt-1 truncate">
                      {email.body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Email Content */}
              <div className="flex-1 p-6 bg-gray-800/30">
                {selectedEmail ? (
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedEmail.subject}</h2>
                    <div className="mt-4 flex items-center gap-4">
                      <div>
                        <div className="font-medium">{selectedEmail.from}</div>
                        <div className="text-sm text-gray-400">
                          To: {selectedEmail.to.join(', ')}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {formatDate(selectedEmail.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 whitespace-pre-wrap text-gray-300">{selectedEmail.body}</div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select an email to read
                  </div>
                )}
              </div>
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
  );
};

export default MailAgent;