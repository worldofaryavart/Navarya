from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import firebase_admin
from firebase_admin import auth, credentials
from services.reminder_service import ReminderService
from services.task_processor import TaskProcessor
from services.mail_processor import mail_processor

app = FastAPI()
reminder_service = ReminderService()
task_processor = TaskProcessor()

# Initialize Firebase Admin
cred = credentials.Certificate('./firebase-credentials.json')
firebase_admin.initialize_app(cred)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Email Models
class EmailDraft(BaseModel):
    to: List[str]
    subject: str
    body: str

class EmailId(BaseModel):
    emailId: str

# Task Endpoints
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

# Mail Endpoints
@app.get("/api/mail/sync")
async def sync_emails(request: Request):
    """Sync emails from Gmail."""
    user = await verify_token(request)
    emails = await mail_processor.get_emails()
    return {"emails": emails}

@app.post("/api/mail/send")
async def send_email(draft: EmailDraft, request: Request):
    """Send an email."""
    user = await verify_token(request)
    result = await mail_processor.send_email(draft.to, draft.subject, draft.body)
    return result

@app.post("/api/mail/mark-read")
async def mark_email_read(email: EmailId, request: Request):
    """Mark an email as read."""
    user = await verify_token(request)
    success = await mail_processor.mark_as_read(email.emailId)
    return {"success": success}

@app.post("/api/mail/extract-meeting")
async def extract_meeting(email: EmailId, request: Request):
    """Extract meeting details from email using AI."""
    user = await verify_token(request)
    # TODO: Implement AI meeting extraction
    return {"meeting": None}

@app.post("/api/mail/extract-task")
async def extract_task(email: EmailId, request: Request):
    """Extract task details from email using AI."""
    user = await verify_token(request)
    # TODO: Implement AI task extraction
    return {"task": None}

@app.post("/api/mail/generate-response")
async def generate_response(email: EmailId, request: Request):
    """Generate AI response for email."""
    user = await verify_token(request)
    # TODO: Implement AI response generation
    return {"response": ""}

@app.post("/api/mail/analyze-importance")
async def analyze_importance(email: EmailId, request: Request):
    """Analyze email importance using AI."""
    user = await verify_token(request)
    # TODO: Implement AI importance analysis
    return {"important": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)