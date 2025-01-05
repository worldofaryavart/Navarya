"use client";

import React, { useEffect, useState } from "react";
import CalendarView from "@/components/TaskScheduler/CalendarView";
import TaskFormModal from "@/components/TaskScheduler/TaskFormModal";
import TaskList from "@/components/TaskScheduler/TaskList";
import { addTask, deleteTask, getTasks, updateTask } from "@/utils/tasks";
import { NewTaskInput, Task } from "@/types/taskTypes";
import Loader from "@/components/commonComp/Loader";
import { useReminderSystem } from "@/hooks/useReminderSystem";
import { useTaskContext } from "@/context/TaskContext";

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, setTasks } = useTaskContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { checkTaskForReminder } = useReminderSystem();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleOpenTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleAddTask = async (newTask: NewTaskInput) => {
    try {
      const taskToAdd = {
        ...newTask,
        createdAt: new Date(),
        status: newTask.status || "Pending",
      } as Task;

      const addedTask = await addTask(taskToAdd);
      setTasks((prevTasks) => [...prevTasks, addedTask]);
      
      await checkTaskForReminder(newTask.description || '');
      
      handleCloseTaskModal();
    } catch (error) {
      console.error("Failed to add task: ", error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (!updatedTask.id) throw new Error("Task ID is required");

      const completeTask: Task = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        createdAt: updatedTask.createdAt || new Date(),
      };

      const result = await updateTask(completeTask);

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? completeTask : task
        )
      );
    } catch (error) {
      console.error("Failed to update task: ", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task: ", error);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-900 text-white overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Task Scheduler</h1>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleOpenTaskModal}
        >
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <CalendarView tasks={tasks} />
        </div>

        <div className="col-span-1">
          <TaskList
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        </div>
      </div>
      {isModalOpen && (
        <TaskFormModal
          isOpen={isModalOpen}
          onClose={handleCloseTaskModal}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          editTask={editingTask}
        />
      )}
    </div>
  );
};

export default Tasks;
