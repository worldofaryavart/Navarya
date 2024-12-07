'use client';

import React from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { useReminderSystem } from "@/hooks/useReminderSystem";

const Header = () => {
  const { reminders, showReminders, toggleReminders, handleCompleteReminder } = useReminderSystem();

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-900 shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-100">AaryaI</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleReminders}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300 relative"
          >
            <FaBell />
            Reminders
            {reminders.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {showReminders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Your Reminders</h2>
              <button 
                onClick={toggleReminders} 
                className="text-gray-600 hover:text-gray-800"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No reminders yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {reminders.map((reminder) => {
                  const reminderTime = new Date(reminder.reminder_time);
                  const isOverdue = reminderTime < new Date();
                  
                  return (
                    <li 
                      key={reminder.id} 
                      className={`p-4 flex items-center gap-4 ${
                        isOverdue ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
                      }`}
                    >
                      <FaBell className="text-xl" />
                      <div className="flex-1">
                        <p className="font-semibold">{reminder.task}</p>
                        <p className="text-sm text-gray-600">
                          {reminderTime.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteReminder(reminder.id)}
                        className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded"
                      >
                        Complete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;