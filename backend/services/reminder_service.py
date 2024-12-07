from datetime import datetime
import re
from dateutil import parser
import pytz

class ReminderService:
    def __init__(self):
        self.reminders = []
        
    def parse_datetime(self, text):
        """Extract date and time from text using basic regex patterns"""
        try:
            # Convert text to datetime using dateutil parser
            parsed_date = parser.parse(text, fuzzy=True)
            print("parsed data is:", parsed_date)
            return parsed_date
        except:
            return None
    
    def create_reminder(self, task, datetime_str):
        reminder_time = self.parse_datetime(datetime_str)
        if reminder_time:
            reminder = {
                'id': len(self.reminders) + 1,
                'task': task,
                'reminder_time': reminder_time,
                'created_at': datetime.now(pytz.UTC),
                'is_completed': False
            }
            self.reminders.append(reminder)
            return reminder
        return None
    
    def get_active_reminders(self):
        """Get all uncompleted reminders"""
        now = datetime.now(pytz.UTC)
        return [r for r in self.reminders if not r['is_completed'] and r['reminder_time'] > now]
    
    def mark_completed(self, reminder_id):
        """Mark a reminder as completed"""
        for reminder in self.reminders:
            if reminder['id'] == reminder_id:
                reminder['is_completed'] = True
                return True
        return False
