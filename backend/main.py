from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
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
from services.mail_processor import mail_processor

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://navarya.vercel.app", "http://localhost:3000", "https://www.navarya.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reminder_service = ReminderService()
task_processor = TaskProcessor()

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
    try:
        user = await verify_token(request)
        emails = await mail_processor.get_emails(user['uid'])
        return {"emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mail/send")
async def send_email(draft: EmailDraft, request: Request):
    """Send an email."""
    try:
        user = await verify_token(request)
        result = await mail_processor.send_email(user['uid'], draft.to, draft.subject, draft.body)
        return {"success": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mail/mark-read")
async def mark_email_read(email: EmailId, request: Request):
    """Mark an email as read."""
    try:
        user = await verify_token(request)
        await mail_processor.mark_as_read(user['uid'], email.emailId)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mail/toggle-important/{email_id}")
async def toggle_important(email_id: str, user_token: dict = Depends(verify_token)):
    """Toggle the important status of an email."""
    try:
        result = await mail_processor.toggle_important(user_token['uid'], email_id)
        return {"success": True, "important": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/mail/{email_id}")
async def delete_email(email_id: str, user_token: dict = Depends(verify_token)):
    """Permanently delete an email."""
    try:
        await mail_processor.delete_email(user_token['uid'], email_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mail/attachment/{message_id}/{attachment_id}")
async def get_attachment(
    message_id: str, 
    attachment_id: str, 
    user_token: dict = Depends(verify_token)
):
    """Download an email attachment."""
    try:
        attachment = await mail_processor.get_attachment(user_token['uid'], message_id, attachment_id)
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        return StreamingResponse(
            io.BytesIO(attachment['data']),
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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