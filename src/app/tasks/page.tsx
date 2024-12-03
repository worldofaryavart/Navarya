"use client";

import React, { useState } from "react";
import CalendarView from "@/components/TaskScheduler/CalendarView";
import TaskFormModal from "@/components/TaskScheduler/TaskFormModal";
import TaskList from "@/components/TaskScheduler/TaskList";

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const handleOpenTaskModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsModalOpen(false);
  };

  const handleAddTask = (newTask: any) => {
    const taskWithId = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'Pending'
    };
    
    setTasks(prevTasks => [...prevTasks, taskWithId]);
  };

  const handleUpdateTask = (updatedTask: any) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Scheduler</h1>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleOpenTaskModal}
          >
            Add Task
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Calendar View - 2/3 width */}
          <div className="col-span-2">
            <CalendarView tasks={tasks} />
          </div>

          {/* Task List - 1/3 width */}
          <div className="col-span-1">
            <TaskList 
              tasks={tasks} 
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </div>

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseTaskModal}
        onSubmit={handleAddTask}
      />
    </div>
  );
};

export default Tasks;