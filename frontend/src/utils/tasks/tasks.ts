import { Task, NewTaskInput } from "@/types/taskTypes";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db, auth, getAuthInstance, waitForAuth } from '../config/firebase.config';

export const addTask = async (task: NewTaskInput): Promise<Task> => {
    try {
        const user = auth?.currentUser;
        if (!user) throw new Error('Not authenticated');

        const tasksCollection = collection(db!, 'tasks');
        const createdAt = new Date();
        const taskData = {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate || null,
          priority: task.priority,
          status: task.status || 'Pending',
          createdAt,
          userId: user.uid // Add user ID to task data
        };
        const docRef = await addDoc(tasksCollection, taskData);
        return { ...taskData, id: docRef.id, createdAt };
      } catch (error) {
        console.error('Error adding task:', error);
        throw error;
      }
};

export const getTasks = async () => {
    try {
        const auth = getAuthInstance();
        if (!auth) throw new Error('Auth not initialized');
        
        // Wait for auth to initialize
        await waitForAuth();
        
        const user = auth.currentUser;
        console.log("user is :", user);
        if (!user) throw new Error('Not authenticated');

        const tasksCollection = collection(db!, 'tasks');
        const q = query(tasksCollection, where('userId', '==', user.uid)); // Only get tasks for current user
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data()
        } as Task));
    } catch (error) {
        console.error("Error fetching tasks: ", error);
        throw error;
    }
};

export const updateTask = async (task: Task) => {
    try {
        const user = auth?.currentUser;
        if (!user) throw new Error('Not authenticated');

        if (!db) throw new Error('Firestore not initialized');
        
        const taskDocRef = doc(db, 'tasks', task.id);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        if (taskDoc.data().userId !== user.uid) throw new Error('Unauthorized');

        await updateDoc(taskDocRef, {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            reminder: task.reminder || null,
        });
    } catch (error) {
        console.error("Error updating task: ", error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        const user = auth?.currentUser;
        if (!user) throw new Error('Not authenticated');

        if (!db) throw new Error('Firestore not initialized');
        
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        if (taskDoc.data().userId !== user.uid) throw new Error('Unauthorized');

        await deleteDoc(taskDocRef);
    } catch (error) {
        console.error("Error deleting task: ", error);
        throw error;
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        const user = auth?.currentUser;
        if (!user) throw new Error('Not authenticated');

        if (!db) throw new Error('Firestore not initialized');
        
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        if (taskDoc.data().userId !== user.uid) throw new Error('Unauthorized');

        return { id: taskDoc.id, ...taskDoc.data() } as Task;
    } catch (error) {
        console.error("Error getting task: ", error);
        throw error;
    }
};