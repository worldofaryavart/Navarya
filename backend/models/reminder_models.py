from pydantic import BaseModel
from typing import Optional, Union
from datetime import datetime

class RecurringReminder(BaseModel):
    frequency: str  # 'daily', 'weekly', 'monthly'
    interval: int
    endDate: Optional[Union[datetime, str]] = None

class ReminderCreate(BaseModel):
    reminderTime: Union[datetime, str]
    recurring: Optional[RecurringReminder] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Reminder(ReminderCreate):
    id: str
    taskId: str
    userId: str
    createdAt: datetime
    lastTriggered: Optional[datetime] = None
