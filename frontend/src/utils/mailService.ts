import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Email, EmailDraft, Meeting } from '@/types/mailTypes';
import { Task } from '@/types/taskTypes';
import { addTask } from './tasks';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/mail';

// Helper function to get auth token
const getAuthToken = async () => {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

// Helper function for API calls
const apiCall = async <T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> => {
  try {
    const token = await getAuthToken();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = method === 'GET' 
      ? await axios.get(`${API_BASE_URL}/${endpoint}`, config)
      : await axios.post(`${API_BASE_URL}/${endpoint}`, data, config);

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

    const response = await apiCall<{emails: Email[]}>('sync');
    const emails = response.emails;
    
    // Store emails in Firestore for offline access
    const batch = [];
    for (const email of emails) {
      batch.push(
        addDoc(collection(db!, 'emails'), {
          ...email,
          timestamp: new Date(email.timestamp),
          userId: user.uid
        })
      );
    }
    await Promise.all(batch);

    return emails;
  } catch (error) {
    console.error('Error syncing emails:', error);
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

export const getEmails = async (folder: string = 'inbox'): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    // First try to get from Firestore for offline access
    const emailsRef = collection(db!, 'emails');
    const q = query(
      emailsRef,
      where('userId', '==', user.uid),
      where('labels', 'array-contains', folder),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const emails = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Email[];

    // If online, sync with Gmail
    if (navigator.onLine) {
      await syncEmails();
    }

    return emails;
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

export const markAsRead = async (emailId: string): Promise<void> => {
  try {
    await apiCall('mark-read', 'POST', { emailId });

    // Update in Firestore
    const emailRef = doc(db!, 'emails', emailId);
    await updateDoc(emailRef, {
      read: true
    });
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
