from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RecurringReminder(BaseModel):
    frequency: str  # 'daily', 'weekly', 'monthly'
    interval: int
    endDate: Optional[datetime] = None

class ReminderCreate(BaseModel):
    reminderTime: datetime
    recurring: Optional[RecurringReminder] = None

class Reminder(ReminderCreate):
    id: str
    taskId: str
    userId: str
    createdAt: datetime
    lastTriggered: Optional[datetime] = None
