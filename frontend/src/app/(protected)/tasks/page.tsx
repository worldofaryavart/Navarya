"use client";

import React, { useEffect, useState } from "react";
import CalendarView from "@/components/TaskScheduler/CalendarView";
import TaskFormModal from "@/components/TaskScheduler/TaskFormModal";
import TaskList from "@/components/TaskScheduler/TaskList";
import TasksSection from "@/components/TaskScheduler/TasksSection"; // Import TasksSection component
import { addTask, deleteTask, getTasks, updateTask } from "@/utils/tasks/tasks";
import { NewTaskInput, Task } from "@/types/taskTypes";
import Loader from "@/components/commonComp/Loader";
import { useTaskContext } from "@/context/TaskContext";
import CalendarTimeline from "@/components/TaskScheduler/CalendarTimeline";

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, setTasks } = useTaskContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    // Initialize Firebase on component mount
    import('@/utils/config/firebase.config').then(({ initFirebase }) => {
      initFirebase();
      setIsLoading(false);
    });
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
      const addedTask = await addTask(newTask);
      setTasks((prevTasks) => [...prevTasks, addedTask]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (!updatedTask.id) throw new Error("Task ID is required");

      const result = await updateTask(updatedTask);
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === result.id ? { ...result, reminder: result.reminder || undefined } : task
        )
      );

      if (isModalOpen) {
        handleCloseTaskModal();
      }
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
    <div className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-100">Task Scheduler</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-sm text-white font-medium py-1.5 px-3 rounded-md transition-colors"
          onClick={handleOpenTaskModal}
        >
          Add Task
        </button>
      </div>

      <div className="flex gap-4 h-[calc(200vh+5.5rem)]">
        {/* Left Column - Calendar and Task List */}
        <div className="w-1/3 space-y-4 flex flex-col">
          <div className="rounded-lg p-4 border border-gray-700/50">
            <CalendarView tasks={tasks} />
          </div>
          <div className="rounded-lg overflow-y-auto border border-gray-700/50 flex-1 custom-scrollbar">
            <TaskList
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          </div>
        </div>

        {/* Right Column - Tasks Section and Timeline */}
        <div className="w-2/3 space-y-4 flex flex-col">
          <div className="rounded-lg overflow-auto border border-gray-700/50 flex-1 custom-scrollbar">
            <TasksSection tasks={tasks} />
          </div>
          <div className="rounded-lg border border-gray-700/50">
            <CalendarTimeline tasks={tasks} />
          </div>
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
