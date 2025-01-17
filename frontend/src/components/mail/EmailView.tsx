// import React, { useState } from 'react';
// import { Email } from '@/types/mailTypes';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// // import { getAuthToken, toggleImportant, deleteEmail, handleForward, sendReply, sendForward, ReplyDraft, ForwardDraft } from '@/utils/mail/mailService';
// import { ChevronLeft, Star, Reply, MoreVertical, Download, Trash, Forward, Mail, FileText, Calendar, Link, Send, ChevronRight } from 'lucide-react';
// import EmailContentRenderer from './EmailContentRenderer';
// import PreviewEmail from './PreviewEmail';

// interface EmailViewProps {
//   email: Email;
//   onClose: () => void;
//   onEmailUpdate?: (email: Email | null) => void;
//   onReply: (email: Email) => void;
//   onForward: (email: Email) => void;
// }

// const EmailView: React.FC<EmailViewProps> = ({ email, onClose, onEmailUpdate, onReply, onForward }) => {
//   const senderName = email.from.split('<')[0].trim();
//   const initials = senderName
//     .split(' ')
//     .map(n => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);

//   // States
//   const [showReplyBox, setShowReplyBox] = useState(false);
//   const [showForwardBox, setShowForwardBox] = useState(false);
//   const [showOriginalEmail, setShowOriginalEmail] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [showMoreOptions, setShowMoreOptions] = useState(false);
//   const [replyData, setReplyData] = useState<ReplyDraft>({
//     to: [email.from],
//     subject: '',
//     body: '',
//     originalEmail: ''
//   });
//   const [forwardData, setForwardData] = useState<ForwardDraft>({
//     to: [],
//     subject: '',
//     body: '',
//     originalEmail: ''
//   });

//   // Handlers
//   const handleReplyClick = () => {
//     setReplyData({
//       to: [email.from],
//       subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
//       body: '',
//       originalEmail: `\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.from} wrote:\n${email.body}`
//     });
//     setShowReplyBox(true);
//     setShowForwardBox(false);
//   };

//   const handleForwardClick = () => {
//     setForwardData({
//       to: [],
//       subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
//       body: '',
//       originalEmail: `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`
//     });
//     setShowForwardBox(true);
//     setShowReplyBox(false);
//   };

//   // const handleSendReply = async (data: ReplyDraft) => {
//   //   try {
//   //     await sendReply(data);
//   //     setShowReplyBox(false);
//   //     setReplyData({ to: [], subject: '', body: '', originalEmail: '' });
//   //   } catch (error) {
//   //     console.error('Error sending reply:', error);
//   //   }
//   // };

//   // const handleSendForward = async () => {
//   //   try {
//   //     await sendForward(forwardData);
//   //     setShowForwardBox(false);
//   //     setForwardData({ to: [], subject: '', body: '', originalEmail: '' });
//   //   } catch (error) {
//   //     console.error('Error sending forward:', error);
//   //   }
//   // };

//   // const handleToggleImportant = async () => {
//   //   try {
//   //     const isImportant = await toggleImportant(email.id);
//   //     if (onEmailUpdate) {
//   //       onEmailUpdate({ ...email, important: isImportant });
//   //     }
//   //   } catch (error) {
//   //     console.error('Error toggling important status:', error);
//   //   }
//   // };

//   // const handleDelete = async () => {
//   //   try {
//   //     await deleteEmail(email.id);
//   //     onClose();
//   //     if (onEmailUpdate) {
//   //       onEmailUpdate(null);
//   //     }
//   //   } catch (error) {
//   //     console.error('Error deleting email:', error);
//   //   }
//   // };

//   // const handleDownload = async (attachment: any) => {
//   //   try {
//   //     console.log('Downloading attachment:', attachment);
//   //     const token = await getAuthToken();
//   //     const response = await fetch(
//   //       `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/mail'}/attachment/${email.id}/${attachment.id}`,
//   //       {
//   //         headers: {
//   //           Authorization: `Bearer ${token}`,
//   //         }
//   //       }
//   //     );

//   //     if (!response.ok) {
//   //       console.error('Download failed:', response.status, response.statusText);
//   //       throw new Error(`Download failed: ${response.statusText}`);
//   //     }

//   //     const blob = await response.blob();
//   //     const url = window.URL.createObjectURL(blob);
//   //     const a = document.createElement('a');
//   //     a.href = url;
//   //     a.download = attachment.name;
//   //     document.body.appendChild(a);
//   //     a.click();
//   //     window.URL.revokeObjectURL(url);
//   //     document.body.removeChild(a);
//   //   } catch (error) {
//   //     console.error('Error downloading attachment:', error);
//   //     throw error;
//   //   }
//   // };

//   // const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>, isForward: boolean = false) => {
//   //   const input = e.currentTarget;
//   //   if (e.key === 'Enter' && input && input.value.trim()) {
//   //     e.preventDefault();
//   //     const email = input.value.trim();
//   //     if (isForward) {
//   //       setForwardData(prev => ({
//   //         ...prev,
//   //         to: [...prev.to, email]
//   //       }));
//   //     } else {
//   //       setReplyData(prev => ({
//   //         ...prev,
//   //         to: [...prev.to, email]
//   //       }));
//   //     }
//   //     input.value = '';
//   //   }
//   // };

//   // const removeRecipient = (emailToRemove: string, isForward: boolean = false) => {
//   //   if (isForward) {
//   //     setForwardData(prev => ({
//   //       ...prev,
//   //       to: prev.to.filter(email => email !== emailToRemove)
//   //     }));
//   //   } else {
//   //     setReplyData(prev => ({
//   //       ...prev,
//   //       to: prev.to.filter(email => email !== emailToRemove)
//   //     }));
//   //   }
//   // };

//   return (
//     <div className="h-full flex flex-col">
//       {/* Email Header - Fixed */}
//       <div className="flex-none p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-800">
//         <div className="flex items-center gap-4 mb-4">
//           <Button variant="ghost" size="icon" onClick={onClose}>
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
//           <h1 className="text-xl font-semibold">{email.subject}</h1>
//         </div>

//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Avatar>
//               <AvatarFallback>{initials}</AvatarFallback>
//             </Avatar>
//             <div>
//               <div className="font-semibold">{senderName}</div>
//               <div className="text-sm text-gray-500">
//                 to {email.to.join(', ')}
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <Button variant="ghost" size="icon" onClick={handleReplyClick}>
//               <Reply className="h-4 w-4" />
//             </Button>
//             <Button variant="ghost" size="icon" onClick={handleForwardClick}>
//               <Forward className="h-4 w-4" />
//             </Button>
//             <Button variant="ghost" size="icon" 
//             // onClick={handleToggleImportant}
//             >
//               <Star className={`h-4 w-4 ${email.important ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//             </Button>
//             <Button variant="ghost" size="icon" 
//             // onClick={handleDelete}
//             >
//               <Trash className="h-4 w-4" />
//             </Button>
//             <Button variant="ghost" size="icon" 
//             // onClick={() => setShowMoreOptions(!showMoreOptions)}
//             >
//               <MoreVertical className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Email Content - Scrollable */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="max-w-[800px] mx-auto p-6">
//           <div className="prose dark:prose-invert max-w-none">
//             <EmailContentRenderer content={email.body} className="email-container" />
//           </div>

//           {/* Reply Box */}
//           {showReplyBox && (
//             <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
//               {/* Recipients */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">To:</label>
//                 <div className="flex flex-wrap gap-2">
//                   {replyData.to.map((recipient, index) => (
//                     <div
//                       key={index}
//                       className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
//                     >
//                       {recipient}
//                       <button
//                         // onClick={() => removeRecipient(recipient)}
//                         className="hover:text-purple-600"
//                       >
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                   <input
//                     type="email"
//                     placeholder="Add more recipients"
//                     className="flex-1 bg-transparent border-none focus:outline-none text-sm"
//                     onKeyDown={(e) => handleAddRecipient(e)}
//                   />
//                 </div>
//               </div>

//               {/* Subject */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">Subject:</label>
//                 <input
//                   type="text"
//                   value={replyData.subject}
//                   onChange={(e) => setReplyData(prev => ({ ...prev, subject: e.target.value }))}
//                   className="w-full p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 />
//               </div>

//               {/* Body */}
//               <div className="mb-4">
//                 <textarea
//                   value={replyData.body}
//                   onChange={(e) => setReplyData(prev => ({ ...prev, body: e.target.value }))}
//                   placeholder="Write your reply..."
//                   className="w-full h-32 p-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
//                 />
//               </div>

//               {/* Original Email Dropdown */}
//               <div className="mb-4">
//                 <button
//                   onClick={() => setShowOriginalEmail(!showOriginalEmail)}
//                   className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
//                 >
//                   <ChevronRight className={`h-4 w-4 transform transition-transform ${showOriginalEmail ? 'rotate-90' : ''}`} />
//                   Show Original Email
//                 </button>

//                 {showOriginalEmail && (
//                   <div className="mt-2 border-l-2 border-purple-500 dark:border-purple-400">
//                     <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
//                       <div className="prose dark:prose-invert max-w-none text-sm">
//                         <EmailContentRenderer
//                           content={email.body}
//                           className="email-container"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-between">
//                 <Button variant="ghost" onClick={() => setShowReplyBox(false)}>
//                   Cancel
//                 </Button>
//                 <div className="flex gap-2">
//                   <Button variant="outline" onClick={() => setShowPreview(true)}>
//                     Preview
//                   </Button>
//                   <Button onClick={() => handleSendReply(replyData)}>
//                     Send Reply
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Forward Box */}
//           {showForwardBox && (
//             <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
//               {/* Recipients */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">To:</label>
//                 <div className="flex flex-wrap gap-2">
//                   {forwardData.to.map((recipient, index) => (
//                     <div
//                       key={index}
//                       className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
//                     >
//                       {recipient}
//                       <button
//                         onClick={() => removeRecipient(recipient, true)}
//                         className="hover:text-purple-600"
//                       >
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                   <input
//                     type="email"
//                     placeholder="Enter email address"
//                     className="flex-1 bg-transparent border-none focus:outline-none text-sm"
//                     onKeyDown={(e) => handleAddRecipient(e, true)}
//                   />
//                 </div>
//               </div>

//               {/* Subject */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">Subject:</label>
//                 <input
//                   type="text"
//                   value={forwardData.subject}
//                   onChange={(e) => setForwardData(prev => ({ ...prev, subject: e.target.value }))}
//                   className="w-full p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 />
//               </div>

//               {/* Body */}
//               <div className="mb-4">
//                 <textarea
//                   value={forwardData.body}
//                   onChange={(e) => setForwardData(prev => ({ ...prev, body: e.target.value }))}
//                   placeholder="Write your message..."
//                   className="w-full h-32 p-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
//                 />
//               </div>

//               {/* Original Email Dropdown */}
//               <div className="mb-4">
//                 <button
//                   onClick={() => setShowOriginalEmail(!showOriginalEmail)}
//                   className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
//                 >
//                   <ChevronRight className={`h-4 w-4 transform transition-transform ${showOriginalEmail ? 'rotate-90' : ''}`} />
//                   Show Forwarded Content
//                 </button>

//                 {showOriginalEmail && (
//                   <div className="mt-2 border-l-2 border-purple-500 dark:border-purple-400">
//                     <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
//                       <div className="prose dark:prose-invert max-w-none text-sm">
//                         <EmailContentRenderer
//                           content={email.body}
//                           className="email-container"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-between">
//                 <Button variant="ghost" onClick={() => setShowForwardBox(false)}>
//                   Cancel
//                 </Button>
//                 <div className="flex gap-2">
//                   <Button variant="outline" onClick={() => setShowPreview(true)}>
//                     Preview
//                   </Button>
//                   <Button onClick={handleSendForward}>
//                     Send
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Preview Modal */}
//           {showPreview && (
//             <PreviewEmail
//               from={email.to[0]} // Current user's email
//               to={showReplyBox ? replyData.to : forwardData.to}
//               subject={showReplyBox ? replyData.subject : forwardData.subject}
//               body={showReplyBox
//                 ? `${replyData.body}\n\n${replyData.originalEmail}`
//                 : `${forwardData.body}\n\n${forwardData.originalEmail}`
//               }
//               onClose={() => setShowPreview(false)}
//             />
//           )}

//           {/* Attachments */}
//           {email.attachments && email.attachments.length > 0 && (
//             <div className="mx-auto max-w-[800px] px-4 py-6 space-y-4">
//               <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                 Attachments ({email.attachments.length})
//               </h3>
//               <div className="grid grid-cols-2 gap-4">
//                 {email.attachments.map((attachment, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
//                   >
//                     <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
//                       {attachment.type === 'document' ? (
//                         <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//                       ) : attachment.type === 'calendar' ? (
//                         <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
//                       ) : (
//                         <Link className="h-5 w-5 text-purple-600 dark:text-purple-400" />
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium truncate">{attachment.name}</p>
//                       <p className="text-xs text-gray-500">{attachment.size}</p>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="shrink-0"
//                       onClick={() => handleDownload(attachment)}
//                     >
//                       <Download className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmailView;