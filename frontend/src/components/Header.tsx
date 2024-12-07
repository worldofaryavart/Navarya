'use client';

import React from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useReminderSystem } from "@/hooks/useReminderSystem";

const Header = () => {
  const { reminders, showReminders, toggleReminders, handleCompleteReminder } = useReminderSystem();

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700/50 shadow-lg p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            AaryaI
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleReminders}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 relative shadow-md"
          >
            <FaBell className="text-blue-100" />
            <span>Reminders</span>
            {reminders.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
              >
                {reminders.length}
              </motion.span>
            )}
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {showReminders && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Reminders</h2>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  onClick={toggleReminders} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </motion.button>
              </div>

              <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
                {reminders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <FaBell className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>No reminders yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reminders.map((reminder) => {
                      const reminderTime = new Date(reminder.reminder_time);
                      const isOverdue = reminderTime < new Date();
                      
                      return (
                        <motion.li 
                          key={reminder.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-4 flex items-center gap-4 ${
                            isOverdue 
                              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200" 
                              : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                          }`}
                        >
                          <FaBell className="text-xl" />
                          <div className="flex-1">
                            <p className="font-semibold">{reminder.task}</p>
                            <p className="text-sm opacity-75">
                              {reminderTime.toLocaleString()}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCompleteReminder(reminder.id)}
                            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-1.5 px-3 rounded-lg transition-colors shadow-sm"
                          >
                            Complete
                          </motion.button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;