import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Email, EmailDraft, Meeting } from '@/types/mailTypes';
import { Task } from '@/types/taskTypes';
import { addTask } from './tasks';
import axios from 'axios';
import { getApiUrl } from './api.config';

// Helper function to get auth token
export const getAuthToken = async () => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

// Helper function for API calls
const apiCall = async <T>(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', data?: any): Promise<T> => {
  try {
    const token = await getAuthToken();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    console.log(`Making API call to ${endpoint}...`);
    let response;
    const url = getApiUrl(`/api/mail/${endpoint}`);
    
    if (method === 'DELETE') {
      response = await axios.delete(url, config);
    } else {
      response = method === 'GET' 
        ? await axios.get(url, config)
        : await axios.post(url, data, config);
    }
    console.log(`API call response:`, response.data);

    return response.data;
  } catch (error: any) {
    console.error(`Error in API call to ${endpoint}:`, error);
    throw new Error(error.response?.data?.detail || error.message);
  }
};

export const syncEmails = async (): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('Syncing emails with Gmail...');
    const response = await apiCall<{emails: Email[]}>('sync');
    if (!response || !response.emails || !Array.isArray(response.emails)) {
      console.error('Invalid response format:', response);
      return [];
    }
    const emails = response.emails;

    // Add userId to each email before saving
    const emailsRef = collection(db!, 'emails');
    emails.forEach(async (email) => {
      await addDoc(emailsRef, {
        ...email,
        userId: user.uid,
        timestamp: new Date()
      });
    });

    return emails;
  } catch (error) {
    console.error('Error syncing with Gmail:', error);
    throw error;
  }
};

export const getEmails = async (folder: string = 'inbox'): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('Getting emails for folder:', folder);
    let emails: Email[] = [];

    return emails;

  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

export const getEmailsFromFirestore = async (): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get emails from Firestore
    const emailsRef = collection(db!, 'emails');
    const q = query(emailsRef, 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        subject: data.subject || '',
        from: data.from || '',
        to: data.to || [],
        cc: data.cc || [],
        bcc: data.bcc || [],
        body: data.body || '',
        timestamp: data.timestamp ? new Date(data.timestamp.toDate()) : new Date(),
        read: data.read || false,
        important: data.important || false,
        labels: data.labels || [],
        attachments: data.attachments || [],
        threadId: data.threadId,
        userId: data.userId
      };
    });
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

export const sendEmail = async (draft: EmailDraft): Promise<boolean> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await apiCall<{success: boolean; messageId: string}>('send', 'POST', draft);

    if (response.success) {
      // Save to sent folder in Firestore
      const emailData = {
        ...draft,
        id: response.messageId,
        from: user.email,
        timestamp: Timestamp.now(),
        read: true,
        important: false,
        labels: ['sent'],
        userId: user.uid
      };

      await addDoc(collection(db!, 'emails'), emailData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const markAsRead = async (emailId: string): Promise<void> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    const emailRef = doc(db!, 'emails', emailId);
    const emailDoc = await getDoc(emailRef);
    
    if (!emailDoc.exists()) throw new Error('Email not found');
    if (emailDoc.data().userId !== user.uid) throw new Error('Unauthorized');

    await updateDoc(emailRef, { read: true });
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
};

export const createMeetingFromEmail = async (email: Email): Promise<Meeting | null> => {
  try {
    const response = await apiCall<{meeting: Meeting | null}>('extract-meeting', 'POST', { emailId: email.id });

    if (response.meeting) {
      const user = auth?.currentUser;
      if (!user) throw new Error('Not authenticated');

      await addDoc(collection(db!, 'meetings'), {
        ...response.meeting,
        userId: user.uid,
        relatedEmailId: email.id
      });
      return response.meeting;
    }
    return null;
  } catch (error) {
    console.error('Error creating meeting:', error);
    return null;
  }
};

export const createTaskFromEmail = async (email: Email): Promise<Task | null> => {
  try {
    const response = await apiCall<{task: Task | null}>('extract-task', 'POST', { emailId: email.id });

    if (response.task) {
      return await addTask({
        ...response.task,
        source: {
          type: 'email',
          emailId: email.id
        }
      });
    }
    return null;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const generateEmailResponse = async (email: Email): Promise<string> => {
  try {
    const response = await apiCall<{response: string}>('generate-response', 'POST', { emailId: email.id });
    return response.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};

export const analyzeEmailImportance = async (email: Email): Promise<boolean> => {
  try {
    const response = await apiCall<{important: boolean}>('analyze-importance', 'POST', { emailId: email.id });
    return response.important;
  } catch (error) {
    console.error('Error analyzing importance:', error);
    return false;
  }
};

export const toggleImportant = async (emailId: string): Promise<boolean> => {
  try {
    const response = await apiCall<{success: boolean; important: boolean}>(`toggle-important/${emailId}`, 'POST');
    return response.important;
  } catch (error) {
    console.error('Error toggling important status:', error);
    throw error;
  }
};

export const deleteEmail = async (emailId: string): Promise<void> => {
  try {
    await apiCall(`trash/${emailId}`, 'DELETE');
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

// Reply thread types
export interface ReplyDraft {
  to: string[];
  subject: string;
  body: string;
  inReplyTo?: string;
  quotedText?: string;
  originalEmail?: string;
}

export interface ForwardDraft {
  to: string[];
  subject: string;
  body: string;
  originalEmail?: string;
}

export const handleReply = async (email: Email): Promise<ReplyDraft> => {
  const replyDraft: ReplyDraft = {
    to: [email.from],
    subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
    body: '',
    inReplyTo: email.id,
    quotedText: `\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.from} wrote:\n${email.body}`,
    originalEmail: email.body
  };
  return replyDraft;
};

export const handleForward = async (email: Email): Promise<ForwardDraft> => {
  const forwardDraft: ForwardDraft = {
    to: [],
    subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
    body: '',
    originalEmail: `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`
  };
  return forwardDraft;
};

export const sendReply = async (replyDraft: ReplyDraft): Promise<void> => {
  try {
    const response = await apiCall<{ success: boolean; messageId?: string; error?: string }>('send', 'POST', {
      to: replyDraft.to,
      subject: replyDraft.subject,
      body: `${replyDraft.body}\n\n${replyDraft.originalEmail || ''}`,
      type: 'reply'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send email');
    }

    // Optionally handle successful send (e.g., show notification)
  } catch (error) {
    console.error('Error sending reply:', error);
    throw error;
  }
};

export const sendForward = async (forwardDraft: ForwardDraft): Promise<void> => {
  try {
    const response = await apiCall<{ success: boolean; messageId?: string; error?: string }>('send', 'POST', {
      to: forwardDraft.to,
      subject: forwardDraft.subject,
      body: `${forwardDraft.body}\n\n${forwardDraft.originalEmail || ''}`,
      type: 'forward'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Error sending forward:', error);
    throw error;
  }
};
