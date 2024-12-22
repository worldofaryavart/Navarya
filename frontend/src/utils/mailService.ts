import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Email, EmailDraft, Meeting } from '@/types/mailTypes';
import { Task } from '@/types/taskTypes';
import { addTask } from './tasks';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const syncEmails = async (): Promise<Email[]> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await axios.get(`${API_BASE_URL}/api/mail/sync`, {
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`
      }
    });

    const emails = response.data.emails;
    
    // Store emails in Firestore for offline access
    const batch = [];
    for (const email of emails) {
      batch.push(
        addDoc(collection(db, 'emails'), {
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

    const response = await axios.post(
      `${API_BASE_URL}/api/mail/send`,
      draft,
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    if (response.data.success) {
      // Save to sent folder in Firestore
      const emailData = {
        ...draft,
        id: response.data.messageId,
        from: user.email,
        timestamp: Timestamp.now(),
        read: true,
        important: false,
        labels: ['sent'],
        userId: user.uid
      };

      await addDoc(collection(db, 'emails'), emailData);
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
    const emailsRef = collection(db, 'emails');
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
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Update in Gmail
    await axios.post(
      `${API_BASE_URL}/api/mail/mark-read`,
      { emailId },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    // Update in Firestore
    const emailRef = doc(db, 'emails', emailId);
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
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Extract meeting details using AI
    const response = await axios.post(
      `${API_BASE_URL}/api/mail/extract-meeting`,
      { emailId: email.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    if (response.data.meeting) {
      const meeting = response.data.meeting;
      await addDoc(collection(db, 'meetings'), {
        ...meeting,
        userId: user.uid,
        relatedEmailId: email.id
      });
      return meeting;
    }
    return null;
  } catch (error) {
    console.error('Error creating meeting:', error);
    return null;
  }
};

export const createTaskFromEmail = async (email: Email): Promise<Task | null> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Extract task details using AI
    const response = await axios.post(
      `${API_BASE_URL}/api/mail/extract-task`,
      { emailId: email.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    if (response.data.task) {
      const task = response.data.task;
      return await addTask({
        ...task,
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
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await axios.post(
      `${API_BASE_URL}/api/mail/generate-response`,
      { emailId: email.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    return response.data.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};

export const analyzeEmailImportance = async (email: Email): Promise<boolean> => {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await axios.post(
      `${API_BASE_URL}/api/mail/analyze-importance`,
      { emailId: email.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      }
    );

    return response.data.important;
  } catch (error) {
    console.error('Error analyzing importance:', error);
    return false;
  }
};
