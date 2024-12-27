import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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

    console.log(`Making API call to ${endpoint}...`);
    const response = method === 'GET' 
      ? await axios.get(`${API_BASE_URL}/${endpoint}`, config)
      : await axios.post(`${API_BASE_URL}/${endpoint}`, data, config);
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

    console.log('Starting email sync...');
    const response = await apiCall<{emails: Email[]}>('sync');
    console.log('Sync response:', response);
    const emails = response.emails;
    console.log('Received emails:', emails);
    
    // Clear existing emails for this user before adding new ones
    const emailsRef = collection(db!, 'emails');
    const existingEmails = await getDocs(
      query(emailsRef, where('userId', '==', user.uid))
    );
    
    // Delete existing emails using deleteDoc
    await Promise.all(
      existingEmails.docs.map((doc) => deleteDoc(doc.ref))
    );
    
    // Add new emails
    await Promise.all(
      emails.map((email) => 
        addDoc(collection(db!, 'emails'), {
          ...email,
          timestamp: new Date(email.timestamp),
          userId: user.uid,
          labels: email.labels || ['inbox'] // Ensure labels exist
        })
      )
    );
    
    return emails;
  } catch (error) {
    console.error('Error syncing emails:', error);
    throw error;
  }
};

export const getEmails = async (folder: string = 'inbox'): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('Getting emails for folder:', folder);
    let emails: Email[] = [];

    // If online, sync with Gmail first
    if (navigator.onLine) {
      try {
        console.log('Online - syncing with Gmail...');
        emails = await syncEmails();
        console.log('Synced emails:', emails);
        // Filter emails for the requested folder
        emails = emails.filter(email => 
          email.labels?.includes(folder) || 
          (folder === 'inbox' && (!email.labels || email.labels.length === 0))
        );
        console.log('Filtered emails for folder:', emails);
      } catch (error) {
        console.error('Error syncing with Gmail:', error);
      }
    }

    // If no emails from sync or offline, get from Firestore
    if (emails.length === 0) {
      const emailsRef = collection(db!, 'emails');
      const q = query(
        emailsRef,
        where('userId', '==', user.uid),
        where('labels', 'array-contains', folder),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      emails = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp.toDate() // Convert Firestore timestamp to Date
      })) as Email[];
    }

    return emails.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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
