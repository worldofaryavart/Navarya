import os
import json
from datetime import datetime
import re
from dateutil import parser
import pytz
from google.cloud import firestore

class ReminderService:
    def __init__(self, db):
        self.db = db
        self.timezone = pytz.timezone('Asia/Kolkata')  # Indian timezone
        self.reminders_ref = self.db.collection('reminders')
        self.reminders = self._load_reminders()
        
    def _load_reminders(self):
        """Load reminders from Firestore"""
        try:
            reminders = self.reminders_ref.stream()
            return [{**reminder.to_dict(), 'id': reminder.id} for reminder in reminders]
        except Exception as e:
            print(f"Error loading reminders: {e}")
            return []

    def _save_reminders(self, reminder):
        """Save reminders to Firestore"""
        try:
            self.reminders_ref.document(str(reminder['id'])).set(reminder)
        except Exception as e:
            print(f"Error saving reminders: {e}")
        
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
        reminder_time = self.parse_datetime(datetime_str) if datetime_str else None
        reminder = {
            'id': len(self.reminders) + 1,
            'task': task,
            'reminder_time': reminder_time.isoformat() if reminder_time else None,  # Store as ISO format string
            'created_at': datetime.now(self.timezone).isoformat(),  # Store as ISO format string
            'is_completed': False
        }
        self.reminders.append(reminder)
        self._save_reminders(reminder)  # Save after adding
        return reminder
    
    def get_active_reminders(self):
        """Get all uncompleted reminders"""
        now = datetime.now(self.timezone)
        active_reminders = []
        
        for r in self.reminders:
            if not r['is_completed']:
                # Include all uncompleted tasks, regardless of reminder time
                active_reminders.append({
                    **r,
                    'is_due': parser.parse(r['reminder_time']) <= now if r['reminder_time'] else False
                })
        
        # Sort by reminder time, with tasks without reminders at the end
        return sorted(
            active_reminders,
            key=lambda x: parser.parse(x['reminder_time']) if x['reminder_time'] else datetime.max.replace(tzinfo=self.timezone)
        )
    
    def mark_completed(self, reminder_id):
        """Mark a reminder as completed"""
        for reminder in self.reminders:
            if reminder['id'] == reminder_id:
                reminder['is_completed'] = True
                self._save_reminders(reminder)  # Save after updating
                return True
        return False
