'use client';

import React, { useState } from 'react';
import { X, Send, Paperclip, Bot } from 'lucide-react';
import { EmailDraft } from '@/types/mailTypes';
import { sendEmail, generateEmailResponse } from '@/utils/mailService';

interface ComposeEmailProps {
  onClose: () => void;
  initialDraft?: EmailDraft;
  replyToEmail?: string;
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({
  onClose,
  initialDraft,
  replyToEmail,
}) => {
  const [draft, setDraft] = useState<EmailDraft>(
    initialDraft || {
      to: [],
      subject: '',
      body: '',
    }
  );
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const handleSend = async () => {
    try {
      await sendEmail(draft);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleAIAssist = async () => {
    if (!replyToEmail) return;

    setIsGeneratingResponse(true);
    try {
      const response = await generateEmailResponse(replyToEmail);
      setDraft(prev => ({
        ...prev,
        body: response
      }));
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-3xl border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">New Message</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Email Form */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="To"
                className="w-full bg-gray-800 border-b border-gray-700 p-2 outline-none text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
                value={draft.to.join('; ')}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    to: e.target.value.split(';').map((email) => email.trim()),
                  }))
                }
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-gray-800 border-b border-gray-700 p-2 outline-none text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
                value={draft.subject}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <textarea
                placeholder="Write your message..."
                className="w-full h-64 p-2 bg-gray-800 outline-none resize-none text-white placeholder-gray-400 rounded-lg border border-gray-700 focus:border-purple-500 transition-colors"
                value={draft.body}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, body: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSend}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Send size={16} />
              Send
            </button>
            <button className="text-gray-400 hover:text-gray-200 transition-colors">
              <Paperclip size={20} />
            </button>
            {replyToEmail && (
              <button
                onClick={handleAIAssist}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                disabled={isGeneratingResponse}
              >
                <Bot size={20} />
                {isGeneratingResponse ? 'Generating...' : 'AI Assist'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 px-4 py-2 transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmail;
