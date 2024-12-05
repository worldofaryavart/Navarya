import { useState } from "react";
import Toast from "./Toast";
import { Reminder } from "@/types/reminder";

interface HeaderProps {
  reminders: Reminder[]; // Replace 'any' with your specific Reminder type if possible
}

const Header: React.FC<HeaderProps> = ({ reminders }) => {
  const [showReminders, setShowReminders] = useState(false);

  const handleReminderClick = () => {
    setShowReminders(!showReminders);
  };

  return (
    <header className="bg-gray-800 border-b border-gray-900 shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-100">AaryaI</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handleReminderClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Reminders ({reminders.length})
        </button>

        {showReminders &&
          reminders.map((reminder) => (
            <Toast
              key={reminder.id}
              message={`Reminder: ${reminder.title}`}
              type={reminder.reminderTime < new Date() ? "error" : "success"}
            />
          ))}
      </div>
    </header>
  );
};

export default Header;
