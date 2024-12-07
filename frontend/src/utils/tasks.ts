import { Task } from "@/types/taskTypes";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const addTask = async (task: Task) => {
    try {
        const tasksCollection = collection(db!, 'tasks');
        const docRef = await addDoc(tasksCollection, {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          createdAt: task.createdAt
        });
        return { ...task, id: docRef.id };
      } catch (error) {
        console.error('Error adding task:', error);
        throw error;
      }
};

export const getTasks = async () => {
    try {
        const tasksCollection = collection(db!, 'tasks');
        const q = query(tasksCollection);
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
        if (!db) throw new Error('Firestore not initialized');

        const taskDocRef = doc(db, 'tasks', task.id);
        await updateDoc(taskDocRef, {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt
          });

        return task;
    } catch (error) {
        console.error("Error updating task: ", error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        if (!db) throw new Error('Firestore not initialized');

        const taskDocRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskDocRef);

        return taskId;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        if (!db) throw new Error('Firestore not initialized');

        const taskDocRef = doc(db, 'tasks', taskId);
        const docSnap = await getDoc(taskDocRef);
        
        if (docSnap.exists()) {
            return {id: docSnap.id, ...docSnap.data() } as Task;
        } else {
            throw new Error('No such task exists');
        }
    } catch (error) {
        console.error('Error fetching task: ', error);
        throw error;
    }
};