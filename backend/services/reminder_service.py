from datetime import datetime
import re
from dateutil import parser
import pytz

class ReminderService:
    def __init__(self):
        self.reminders = []
        self.timezone = pytz.timezone('Asia/Kolkata')  # Indian timezone
        
    def parse_datetime(self, text):
        """Extract date and time from text using basic regex patterns"""
        try:
            # Convert text to datetime using dateutil parser
            parsed_date = parser.parse(text, fuzzy=True)
            print("parsed date is:", parsed_date)
            
            # Make timezone-aware if it's naive
            if parsed_date.tzinfo is None:
                parsed_date = self.timezone.localize(parsed_date)
            return parsed_date
        except Exception as e:
            print("Error parsing date:", e)
            return None
    
    def create_reminder(self, task, datetime_str):
        reminder_time = self.parse_datetime(datetime_str)
        if reminder_time:
            reminder = {
                'id': len(self.reminders) + 1,
                'task': task,
                'reminder_time': reminder_time.isoformat(),  # Store as ISO format string
                'created_at': datetime.now(self.timezone).isoformat(),  # Store as ISO format string
                'is_completed': False
            }
            self.reminders.append(reminder)
            return reminder
        return None
    
    def get_active_reminders(self):
        """Get all uncompleted reminders"""
        now = datetime.now(self.timezone)
        active_reminders = []
        
        for r in self.reminders:
            if not r['is_completed']:
                # Parse the stored ISO format strings back to datetime
                reminder_time = parser.parse(r['reminder_time'])
                if reminder_time > now:
                    active_reminders.append(r)
        
        return active_reminders
    
    def mark_completed(self, reminder_id):
        """Mark a reminder as completed"""
        for reminder in self.reminders:
            if reminder['id'] == reminder_id:
                reminder['is_completed'] = True
                return True
        return False
