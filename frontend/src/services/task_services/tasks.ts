import { Task, NewTaskInput } from "@/types/taskTypes";
import { auth } from "@/utils/config/firebase.config";
import { getApiUrl } from "@/utils/config/api.config";

const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return token;
};

export const addTask = async (task: NewTaskInput): Promise<Task> => {
    try {
        const token = await getAuthToken();
        const response = await fetch(getApiUrl('/api/tasks'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to add task');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
};

export const getTasks = async () => {
    try {
        const token = await getAuthToken();
        const response = await fetch(getApiUrl('/api/tasks'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch tasks');
        }

        return await response.json() as Task[];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

export const updateTask = async (task: Task) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(getApiUrl(`/api/tasks/${task.id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to update task');
        }

        return await response.json() as Task;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch task');
        }

        return await response.json() as Task;
    } catch (error) {
        console.error('Error fetching task:', error);
        throw error;
    }
};