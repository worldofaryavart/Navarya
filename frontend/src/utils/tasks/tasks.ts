import { Task, NewTaskInput } from "@/types/taskTypes";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where, Timestamp } from "firebase/firestore";
import { db, auth } from '../config/firebase.config';

const ensureAuth = () => {
    if (typeof window === 'undefined') throw new Error('Cannot access Firebase on server side');
    if (!auth) throw new Error('Firebase Auth not initialized');
    if (!auth.currentUser) throw new Error('Not authenticated');
    if (!db) throw new Error('Database not initialized');
    return { user: auth.currentUser, db };
};

export const addTask = async (task: NewTaskInput): Promise<Task> => {
    try {
        const { user, db } = ensureAuth();

        const tasksCollection = collection(db, 'tasks');
        const createdAt = Timestamp.fromDate(new Date());
        const taskData = {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate || null,
            priority: task.priority,
            status: task.status || 'Pending',
            createdAt,
            userId: user.uid
        };

        const docRef = await addDoc(tasksCollection, taskData);
        return {
            id: docRef.id,
            ...taskData
        } as Task;
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
};

export const getTasks = async () => {
    try {
        const { user, db } = ensureAuth();

        const tasksCollection = collection(db, 'tasks');
        const q = query(tasksCollection, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Task[];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

export const updateTask = async (task: Task) => {
    try {
        const { user, db } = ensureAuth();
        
        const taskDocRef = doc(db, 'tasks', task.id);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) {
            throw new Error('Task not found');
        }

        const currentTask = taskDoc.data() as Task;
        if (currentTask.userId !== user.uid) {
            throw new Error('Not authorized to update this task');
        }

        const updates = {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            reminder: task.reminder || null,
        };

        await updateDoc(taskDocRef, updates);
        return { id: task.id, ...updates } as Task;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        const { user, db } = ensureAuth();
        
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) {
            throw new Error('Task not found');
        }

        const task = taskDoc.data() as Task;
        if (task.userId !== user.uid) {
            throw new Error('Not authorized to delete this task');
        }

        await deleteDoc(taskDocRef);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        const { user, db } = ensureAuth();
        
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) {
            throw new Error('Task not found');
        }

        const task = taskDoc.data() as Task;
        if (task.userId !== user.uid) {
            throw new Error('Not authorized to view this task');
        }

        return { ...task, id: taskId } as Task;
    } catch (error) {
        console.error('Error fetching task:', error);
        throw error;
    }
};