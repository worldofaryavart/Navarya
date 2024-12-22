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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button onClick={onClose}>
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
                className="w-full border-b p-2 outline-none"
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
                className="w-full border-b p-2 outline-none"
                value={draft.subject}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <textarea
                placeholder="Write your message..."
                className="w-full h-64 p-2 outline-none resize-none"
                value={draft.body}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, body: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Paperclip size={20} />
            </button>
            {replyToEmail && (
              <button
                onClick={handleAIAssist}
                className="flex items-center gap-2 text-purple-500 hover:text-purple-700"
                disabled={isGeneratingResponse}
              >
                <Bot size={20} />
                {isGeneratingResponse ? 'Generating...' : 'AI Assist'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 px-4 py-2"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmail;
