import os
import json
from datetime import datetime
import re
from dateutil import parser
import pytz
from google.cloud import firestore
from typing import Union

class ReminderService:
    def __init__(self, db):
        self.db = db
        self.timezone = pytz.timezone('Asia/Kolkata')  # Indian timezone
        self.reminders_ref = self.db.collection('reminders')
        
    def get_active_reminders(self):
        """Get all active reminders"""
        try:
            now = datetime.now(self.timezone)
            reminders = self.reminders_ref.stream()
            active_reminders = []
            
            for reminder in reminders:
                data = reminder.to_dict()
                data['id'] = reminder.id
                
                # Skip if reminder is already triggered and not recurring
                if data.get('lastTriggered') and not data.get('recurring'):
                    continue
                    
                # Convert reminder time to datetime for comparison
                reminder_time = None
                if isinstance(data.get('reminderTime'), str):
                    reminder_time = parser.parse(data['reminderTime'])
                elif isinstance(data.get('reminderTime'), datetime):
                    reminder_time = data['reminderTime']
                
                if reminder_time:
                    # Make timezone-aware if it's naive
                    if reminder_time.tzinfo is None:
                        reminder_time = self.timezone.localize(reminder_time)
                        
                    data['isDue'] = reminder_time <= now
                    
                    # For recurring reminders, check if it's time for next occurrence
                    if data.get('recurring'):
                        last_triggered = None
                        if data.get('lastTriggered'):
                            last_triggered = parser.parse(data['lastTriggered'])
                            if last_triggered.tzinfo is None:
                                last_triggered = self.timezone.localize(last_triggered)
                                
                        if not last_triggered or last_triggered < reminder_time:
                            active_reminders.append(data)
                    else:
                        # For non-recurring reminders, include if not triggered
                        if not data.get('lastTriggered'):
                            active_reminders.append(data)
            
            return active_reminders
            
        except Exception as e:
            print(f"Error getting active reminders: {e}")
            return []

    def add_task_reminder(self, task_id: str, user_id: str, reminder_time: Union[datetime, str], recurring=None):
        """Add a reminder for a specific task"""
        try:
            # Convert reminder time to timestamp
            if isinstance(reminder_time, str):
                reminder_time = parser.parse(reminder_time)
            
            # Convert to UTC timestamp
            timestamp_seconds = int(reminder_time.timestamp())
            current_time = datetime.now()
            
            reminder_data = {
                'taskId': task_id,
                'userId': user_id,
                'time': {
                    'seconds': timestamp_seconds,
                    'nanoseconds': 0
                },
                'createdAt': {
                    'seconds': int(current_time.timestamp()),
                    'nanoseconds': 0
                },
                'notificationSent': False
            }
            
            if recurring:
                reminder_data['recurring'] = recurring
                if recurring.get('endDate'):
                    end_date = parser.parse(recurring['endDate']) if isinstance(recurring['endDate'], str) else recurring['endDate']
                    reminder_data['recurring']['endDate'] = {
                        'seconds': int(end_date.timestamp()),
                        'nanoseconds': 0
                    }

            print("Adding reminder with data:", reminder_data)

            # Add to Firestore reminders collection
            doc_ref = self.reminders_ref.document()
            doc_ref.set(reminder_data)
            
            # Update the task document with the reminder
            task_ref = self.db.collection('tasks').document(task_id)
            task_ref.update({
                'reminder': reminder_data
            })
            
            return {
                'id': doc_ref.id,
                **reminder_data
            }
        except Exception as e:
            print(f"Error adding task reminder: {e}")
            raise

    def remove_task_reminder(self, task_id: str):
        """Remove reminder for a specific task"""
        try:
            # Query for reminders with this task ID
            reminders = self.reminders_ref.where('taskId', '==', task_id).stream()
            
            # Delete each found reminder
            for reminder in reminders:
                reminder.reference.delete()
            
            # Remove reminder from task document
            task_ref = self.db.collection('tasks').document(task_id)
            task_ref.update({
                'reminder': firestore.DELETE_FIELD
            })
        except Exception as e:
            print(f"Error removing task reminder: {e}")
            raise

    def get_task_reminders(self, task_id: str):
        """Get all reminders for a specific task"""
        try:
            reminders = self.reminders_ref.where('taskId', '==', task_id).stream()
            return [{**reminder.to_dict(), 'id': reminder.id} for reminder in reminders]
        except Exception as e:
            print(f"Error getting task reminders: {e}")
            raise

    def mark_reminder_triggered(self, reminder_id: str):
        """Mark a reminder as triggered"""
        try:
            reminder_ref = self.reminders_ref.document(reminder_id)
            reminder_ref.update({
                'lastTriggered': datetime.now(self.timezone).isoformat()
            })
            return True
        except Exception as e:
            print(f"Error marking reminder as triggered: {e}")
            return False

    async def mark_notification_sent(self, task_id: str):
        """Mark a reminder's notification as sent"""
        try:
            print(f"Finding reminders for task: {task_id}")
            # Query for reminders with this task ID
            reminders = list(self.reminders_ref.where('taskId', '==', task_id).stream())
            
            if not reminders:
                print(f"No reminders found for task: {task_id}")
                # Check if task exists
                task_ref = self.db.collection('tasks').document(task_id)
                task = task_ref.get()
                if not task.exists:
                    raise ValueError(f"Task {task_id} not found")
                if not task.to_dict().get('reminder'):
                    raise ValueError(f"Task {task_id} has no reminder")
                return True
            
            print(f"Found {len(reminders)} reminders for task {task_id}")
            for reminder in reminders:
                reminder_ref = self.reminders_ref.document(reminder.id)
                reminder_data = reminder.to_dict()
                
                # Update the reminder document
                print(f"Updating reminder {reminder.id}")
                reminder_ref.update({
                    'notificationSent': True,
                    'lastTriggered': datetime.now(self.timezone).isoformat()
                })
                
                # Update the task document's reminder field
                print(f"Updating task {task_id} reminder field")
                task_ref = self.db.collection('tasks').document(task_id)
                task_ref.update({
                    'reminder.notificationSent': True,
                    'reminder.lastTriggered': datetime.now(self.timezone).isoformat()
                })
            return True
        except Exception as e:
            print(f"Error in mark_notification_sent: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise
