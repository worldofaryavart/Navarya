// src/components/email/EmailView.tsx
import { Email } from '@/types/mailTypes';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getAuthToken, toggleImportant, deleteEmail, handleReply, handleForward, sendReply, ReplyDraft } from '@/utils/mailService';
import { ChevronLeft, Star, Reply, MoreVertical, Download, Trash, Forward, Mail, FileText, Calendar, Link, Send } from 'lucide-react';
import EmailContentRenderer from './EmailContentRenderer';
import { isJobAlertEmail, formatJobAlertEmail } from '@/utils/emailContentFormatter';
import { useState } from 'react';

interface EmailViewProps {
  email: Email;
  onClose: () => void;
  onEmailUpdate?: (email: Email | null) => void;
  onReply?: (email: Email) => void;
  onForward?: (email: Email) => void;
}

export default function EmailView({ email, onClose, onEmailUpdate, onReply, onForward }: EmailViewProps) {
  const senderName = email.from.split('<')[0].trim();
  const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  console.log("selected mail body is : ", email.body);
  // Function to render different types of content
  const renderEmailContent = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <EmailContentRenderer 
          content={email.body}
          className="email-container mx-auto w-full max-w-[800px] px-4 py-6"
        />
      </div>
    );
  };

  const handleDownload = async (attachment: any) => {
    try {
      console.log('Downloading attachment:', attachment);
      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/mail'}/attachment/${email.id}/${attachment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  };

  const handleToggleImportant = async () => {
    try {
      const isImportant = await toggleImportant(email.id);
      if (onEmailUpdate) {
        onEmailUpdate({ ...email, important: isImportant });
      }
    } catch (error) {
      console.error('Error toggling important status:', error);
      // You might want to show a toast notification here
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmail(email.id);
      onClose();
      if (onEmailUpdate) {
        onEmailUpdate(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      // You might want to show a toast notification here
    }
  };

  const handleReplyClick = async () => {
    setReplyData({
      to: [email.from],
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: ''
    });
    setShowReplyBox(true);
  };

  const handleForwardClick = () => {
    if (onForward) {
      const forwardData = handleForward(email);
      onForward({
        ...email,
        to: [],
        subject: forwardData.subject,
        body: forwardData.body
      });
    }
  };

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const email = input.value.trim();
      if (email && !replyData.to.includes(email)) {
        setReplyData(prev => ({
          ...prev,
          to: [...prev.to, email]
        }));
      }
      input.value = '';
    }
  };

  const removeRecipient = (emailToRemove: string) => {
    setReplyData(prev => ({
      ...prev,
      to: prev.to.filter(email => email !== emailToRemove)
    }));
  };

  const handleSendReply = async (replyData: { to: string[], subject: string, body: string }) => {
    try {
      await sendReply({
        to: replyData.to,
        subject: replyData.subject,
        body: replyData.body
      });
      setShowReplyBox(false);
      setReplyText('');
      // Optionally refresh the email thread
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyData, setReplyData] = useState({
    to: [] as string[],
    subject: '',
    body: ''
  });
  const [replyText, setReplyText] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Email Header - Fixed */}
      <div className="flex-none p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold truncate flex-1">{email.subject}</h1>
        </div>

        {/* Sender Info and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={email.senderAvatar} alt={senderName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold truncate">{senderName}</h2>
                <span className="text-sm text-gray-500">
                  {format(new Date(email.timestamp), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                To: {email.to.join(', ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={handleToggleImportant}>
              <Star className={`h-5 w-5 ${email.important ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReplyClick}>
              <Reply className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleForwardClick}>
              <Forward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400">
              <Trash className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowMoreOptions(!showMoreOptions)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
            {showMoreOptions && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {/* Add mark as unread functionality */}}
                  >
                    Mark as unread
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {/* Add print functionality */}}
                  >
                    Print
                  </button>
                  {/* Add more options as needed */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        {renderEmailContent()}

        {/* Reply Thread */}
        {showReplyBox && (
          <div className="mx-auto max-w-[800px] px-4 py-6 border-t dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {/* From Section */}
              <div className="flex items-center gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 w-16">From:</div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{/* Add user email */}</span>
                </div>
              </div>

              {/* To Section with Multiple Recipients */}
              <div className="flex gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 w-16 pt-2">To:</div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {replyData.to.map((recipient, index) => (
                      <div 
                        key={index}
                        className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                      >
                        <span>{recipient}</span>
                        <button
                          onClick={() => removeRecipient(recipient)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="email"
                    placeholder="Type email and press Enter"
                    className="w-full bg-transparent border-none p-1 focus:outline-none text-sm"
                    onKeyDown={handleAddRecipient}
                  />
                </div>
              </div>

              {/* Subject Section */}
              <div className="flex gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 w-16">Subject:</div>
                <input
                  type="text"
                  value={replyData.subject}
                  onChange={(e) => setReplyData(prev => ({ ...prev, subject: e.target.value }))}
                  className="flex-1 bg-transparent border-none p-1 focus:outline-none text-sm"
                />
              </div>

              {/* Body Section */}
              <div className="mb-4">
                <textarea
                  value={replyData.body}
                  onChange={(e) => setReplyData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your reply..."
                  className="w-full h-32 p-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setShowReplyBox(false)}>
                  Discard
                </Button>
                <Button 
                  onClick={() => handleSendReply(replyData)} 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={replyData.to.length === 0 || !replyData.subject || !replyData.body}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mx-auto max-w-[800px] px-4 py-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Attachments ({email.attachments.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    {attachment.type === 'document' ? (
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : attachment.type === 'calendar' ? (
                      <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Link className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500">{attachment.size}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}