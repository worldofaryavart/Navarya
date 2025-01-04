from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import auth, credentials, firestore
import io
import mimetypes
from io import BytesIO

# Initialize Firebase Admin first
cred = credentials.Certificate('./firebase-credentials.json')
default_app = firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Now import services that depend on Firebase
from services.reminder_service import ReminderService
from services.task_processor import TaskProcessor
reminder_service = ReminderService(db)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://navarya.vercel.app", "http://localhost:3000", "https://www.navarya.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_processor = TaskProcessor(db)

# Dependency to verify Firebase token
async def verify_token(request: Request):
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Task Models
class TaskBase(BaseModel):
    content: str

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: str
    user_id: str

# Task endpoints
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
        
        # If this is a create_task action, create a reminder
        if result.get("success") and result.get("action") == "create_task" and result.get("data"):
            task_data = result["data"]
            reminder = reminder_service.create_reminder(
                task_data["title"],
                task_data.get("dueDate", None)
            )
            if reminder:
                result["data"]["reminder"] = reminder
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)