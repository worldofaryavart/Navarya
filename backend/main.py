from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import firebase_admin
from firebase_admin import auth, credentials
from services.reminder_service import ReminderService
from services.task_processor import TaskProcessor
from services.mail_processor import mail_processor
import io
import mimetypes
from io import BytesIO

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
    try:
        emails = await mail_processor.get_emails()
        # Ensure we're returning a list
        if not isinstance(emails, list):
            emails = []
        return {"emails": emails}  # Return as an object with emails array
    except Exception as e:
        print(f"Error in sync_emails: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mail/attachment/{message_id}/{attachment_id}")
async def get_attachment(
    message_id: str, 
    attachment_id: str, 
    user_token: dict = Depends(verify_token)
):
    """Download an email attachment."""
    try:
        print(f"Attempting to download attachment: {attachment_id} from message: {message_id}")
        attachment = await mail_processor.get_attachment(message_id, attachment_id)
        if not attachment:
            print(f"Attachment not found: {attachment_id}")
            raise HTTPException(status_code=404, detail="Attachment not found")

        print(f"Successfully retrieved attachment: {attachment_id}, size: {attachment['size']} bytes")
        
        # Create a BytesIO object from the attachment data
        file_obj = BytesIO(attachment['data'])
        
        # Guess the mime type (default to application/octet-stream if unknown)
        mime_type, _ = mimetypes.guess_type(attachment_id)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        print(f"Sending attachment with mime type: {mime_type}")

        # Return the file as a streaming response
        return StreamingResponse(
            file_obj,
            media_type=mime_type,
            headers={
                'Content-Disposition': f'attachment; filename="{attachment_id}"',
                'Content-Length': str(attachment['size'])
            }
        )
    except Exception as e:
        print(f"Error downloading attachment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/api/mail/toggle-important/{email_id}")
async def toggle_important(email_id: str, user_token: dict = Depends(verify_token)):
    """Toggle the important status of an email."""
    try:
        result = await mail_processor.toggle_important(email_id)
        return {"success": True, "important": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/mail/delete/{email_id}")
async def delete_email(email_id: str, user_token: dict = Depends(verify_token)):
    """Permanently delete an email."""
    try:
        await mail_processor.delete_email(email_id, permanent=True)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/mail/trash/{email_id}")
async def trash_email(email_id: str, user_token: dict = Depends(verify_token)):
    """Move an email to trash."""
    try:
        await mail_processor.delete_email(email_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)