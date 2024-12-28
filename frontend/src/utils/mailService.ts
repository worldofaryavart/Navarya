import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Email, EmailDraft, Meeting } from '@/types/mailTypes';
import { Task } from '@/types/taskTypes';
import { addTask } from './tasks';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/mail';

// Helper function to get auth token
export const getAuthToken = async () => {
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
    console.log('Syncing emails with Gmail...');
    const response = await apiCall<{emails: Email[]}>('sync');
    if (!response || !response.emails || !Array.isArray(response.emails)) {
      console.error('Invalid response format:', response);
      return [];
    }
    return response.emails;
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
      emails = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp)
        };
      }) as Email[];
    }

    return emails.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

export const getEmailsFromFirestore = async (): Promise<Email[]> => {
  try {
    // Get emails from Firestore
    const emailsRef = collection(db, 'emails');
    const q = query(emailsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
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
  let retries = 3;
  while (retries > 0) {
    try {
      // First check if the document exists
      const emailRef = doc(db!, 'emails', emailId);
      const emailDoc = await getDoc(emailRef);
      
      if (!emailDoc.exists()) {
        console.log(`Email document ${emailId} not found, waiting for sync...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        retries--;
        continue;
      }

      // Update in backend
      await apiCall('mark-read', 'POST', { emailId });

      // Update in Firestore
      await updateDoc(emailRef, {
        read: true,
        updatedAt: Timestamp.now()
      });
      
      console.log(`Successfully marked email ${emailId} as read`);
      return;
    } catch (error) {
      console.error('Error marking email as read:', error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
  }
  throw new Error(`Failed to mark email ${emailId} as read after 3 retries`);
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
