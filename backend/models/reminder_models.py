from pydantic import BaseModel, validator
from typing import Optional, Union
from datetime import datetime
from dateutil import parser

class RecurringReminder(BaseModel):
    frequency: str  # 'daily', 'weekly', 'monthly'
    interval: int
    endDate: Optional[Union[datetime, str]] = None

    @validator('endDate', pre=True)
    def parse_end_date(cls, v):
        if isinstance(v, str):
            return parser.parse(v)
        return v

class ReminderCreate(BaseModel):
    reminderTime: Union[datetime, str]
    recurring: Optional[RecurringReminder] = None

    @validator('reminderTime', pre=True)
    def parse_reminder_time(cls, v):
        if isinstance(v, str):
            return parser.parse(v)
        return v

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
