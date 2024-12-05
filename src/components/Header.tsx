import React, { useState } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { Reminder } from "@/types/reminder";

interface HeaderProps {
  reminders: Reminder[];
}

const Header: React.FC<HeaderProps> = ({ reminders }) => {
  const [showReminders, setShowReminders] = useState(false);

  const toggleReminders = () => {
    setShowReminders(!showReminders);
  };

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
                {reminders.map((reminder) => (
                  <li 
                    key={reminder.id} 
                    className={`p-4 flex items-center gap-4 ${
                      reminder.reminderTime < new Date() 
                        ? "bg-red-50 text-red-800" 
                        : "bg-green-50 text-green-800"
                    }`}
                  >
                    <FaBell className="text-xl" />
                    <div>
                      <p className="font-semibold">{reminder.title}</p>
                      <p className="text-sm text-gray-600">
                        {reminder.reminderTime.toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;