from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.reminder_service import ReminderService
from services.task_processor import TaskProcessor

app = FastAPI()
reminder_service = ReminderService()
task_processor = TaskProcessor()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskBase(BaseModel):
    content: str

@app.post("/api/check-reminder")
async def check_reminder(task: TaskBase):
    """Check if a task contains a reminder and extract it"""
    reminder_time = reminder_service.parse_datetime(task.content)
    if reminder_time:
        reminder = reminder_service.create_reminder(task.content, task.content)
        return {"has_reminder": True, "reminder": reminder}
    return {"has_reminder": False}

@app.post("/api/process-task")
async def process_task(task: TaskBase):
    """Process natural language task requests using AI"""
    try:
        result = await task_processor.process_message(task.content)
        print("Processing result:", result)  # Debug log
        return result
    except Exception as e:
        print("Error processing task:", str(e))  # Debug log
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/reminders")
async def get_reminders():
    """Get all active reminders"""
    return reminder_service.get_active_reminders()

@app.put("/api/reminders/{reminder_id}/complete")
async def complete_reminder(reminder_id: int):
    """Mark a reminder as completed"""
    if reminder_service.mark_completed(reminder_id):
        return {"message": "Reminder marked as completed"}
    raise HTTPException(status_code=404, detail="Reminder not found")