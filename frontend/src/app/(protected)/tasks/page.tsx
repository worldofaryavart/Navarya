"use client";

import React from "react";
import CalendarView from "@/components/TaskScheduler/CalendarView";
import TasksSection from "@/components/TaskScheduler/TasksSection";
import Loader from "@/components/commonComp/Loader";
import { useTaskContext } from "@/context/TaskContext";

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const Tasks = () => {
  const { tasks, isLoading } = useTaskContext();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-4 text-white mt-16">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-100">Task Scheduler</h1>
      </div>

      <div className="flex gap-4 md:flex-row flex-col">
        <div className="w-full md:w-2/3 space-y-4 flex flex-col flex-1">
          <div className="rounded-lg p-4 border border-gray-700/50">
            <CalendarView tasks={tasks} />
          </div>
          <div className="rounded-lg overflow-auto border border-gray-700/50 custom-scrollbar min-h-[322px]">
            <TasksSection tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
