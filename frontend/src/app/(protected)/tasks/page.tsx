"use client";

import React, { useState } from "react";
import CalendarView from "@/components/TaskScheduler/CalendarView";
import TaskFormModal from "@/components/TaskScheduler/TaskFormModal";
import TaskList from "@/components/TaskScheduler/TaskList";
import TasksSection from "@/components/TaskScheduler/TasksSection";
import { addTask, deleteTask, updateTask } from "@/services/task_services/tasks";
import { NewTaskInput, Task } from "@/types/taskTypes";
import Loader from "@/components/commonComp/Loader";
import { useTaskContext } from "@/context/TaskContext";
import CalendarTimeline from "@/components/TaskScheduler/CalendarTimeline";

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tasks, setTasks, isLoading } = useTaskContext();
  // const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
      setTasks(prevTasks => [...prevTasks, addedTask]);
      handleCloseTaskModal();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (!updatedTask.id) throw new Error("Task ID is required");

      const result = await updateTask(updatedTask);
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === result.id ? { ...result, reminder: result.reminder || undefined } : task
        )
      );

      handleCloseTaskModal();
    } catch (error) {
      console.error("Failed to update task: ", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-4 text-white mt-16">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-100">Task Scheduler</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-sm text-white font-medium py-1.5 px-3 rounded-md transition-colors"
          onClick={handleOpenTaskModal}
        >
          Add Task
        </button>
      </div>

      <div className="flex gap-4 md:flex-row flex-col">
        {/* Right Column - Tasks Section and Timeline */}
        <div className="w-full md:w-2/3 space-y-4 flex flex-col flex-1">
          <div className="rounded-lg p-4 border border-gray-700/50">
            <CalendarView tasks={tasks} />
          </div>
          <div className="rounded-lg overflow-auto border border-gray-700/50 custom-scrollbar min-h-[322px]">
            <TasksSection tasks={tasks} />
          </div>
        </div>

        {/* Left Column - Calendar and Task List */}
        <div className="w-full md:w-1/3 space-y-4 flex flex-col md:order-none order-last">
          <div className="rounded-lg overflow-y-auto border border-gray-700/50 custom-scrollbar h-[650px]">
            <TaskList
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
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
