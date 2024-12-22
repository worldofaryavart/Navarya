'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Email, EmailFolder, EmailLabel } from '@/types/mailTypes';
import { Loader2, Search, Plus, Inbox, Send, Archive, Trash, Tag, Star } from 'lucide-react';

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
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [folders] = useState<EmailFolder[]>(defaultFolders);
  const [labels] = useState<EmailLabel[]>(defaultLabels);
  const [currentFolder, setCurrentFolder] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    const loadEmails = async () => {
      // TODO: Implement email loading
      setLoading(false);
    };

    if (user) {
      loadEmails();
    }
  }, [user, currentFolder]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement email search
  };

  const handleComposeClick = () => {
    setShowCompose(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <button
            onClick={handleComposeClick}
            className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2"
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
              className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                currentFolder === folder.id ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              {folder.type === 'inbox' && <Inbox size={20} />}
              {folder.type === 'sent' && <Send size={20} />}
              {folder.type === 'drafts' && <Archive size={20} />}
              {folder.type === 'trash' && <Trash size={20} />}
              {folder.name}
              {folder.unreadCount > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2">
                  {folder.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 px-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Labels</h3>
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-2 py-1 cursor-pointer"
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
        <div className="bg-white border-b p-4">
          <div className="max-w-xl flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              className="bg-transparent border-none outline-none flex-1"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Email List and Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Email List */}
            <div className="w-1/3 border-r overflow-y-auto">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 border-b cursor-pointer ${
                    selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {email.important && <Star size={16} className="text-yellow-400" />}
                    <span className="font-semibold">{email.from}</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{email.subject}</div>
                  <div className="text-sm text-gray-500 mt-1 truncate">
                    {email.body}
                  </div>
                </div>
              ))}
            </div>

            {/* Email Content */}
            <div className="flex-1 p-6">
              {selectedEmail ? (
                <div>
                  <h2 className="text-2xl font-semibold">{selectedEmail.subject}</h2>
                  <div className="mt-4 flex items-center gap-4">
                    <div>
                      <div className="font-medium">{selectedEmail.from}</div>
                      <div className="text-sm text-gray-500">
                        To: {selectedEmail.to.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 whitespace-pre-wrap">{selectedEmail.body}</div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Select an email to read
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MailAgent;