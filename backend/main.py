from fastapi import FastAPI, HTTPException, Depends, Request, Response, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from models.reminder_models import ReminderCreate, Reminder
from services.task_services import TaskService
from services.reminder_service import ReminderService
from services.processor_factory import ProcessorFactory
from services.context_manager import ContextManager
from services.conversation_history import ConversationHistoryService
from utils.exceptions import TaskException, TaskNotFoundError, UnauthorizedError, ValidationError, DatabaseError

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize services
reminder_service = ReminderService(db)
context_manager = ContextManager(db)
task_service = TaskService(db)
conversation_service = ConversationHistoryService(db)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        decoded_token = firebase_admin.auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.exception_handler(TaskException)
async def task_exception_handler(request, exc: TaskException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "additional_info": exc.additional_info
            }
        }
    )

async def get_token(authorization: str = Header(...)):
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise UnauthorizedError("Invalid token format")
        token = authorization.split(' ')[1]
        print(f"Extracted token: {token[:10]}...")  
        return token
    except Exception as e:
        print(f"Token extraction error: {str(e)}")  
        raise UnauthorizedError(f"Token error: {str(e)}")

# Task Models
class TaskBase(BaseModel):
    content: str
    context: Optional[dict] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: str
    user_id: str

@app.post("/api/process-command")
async def process_command(task: TaskBase):
    """Process natural language commands using AI"""
    try:
        processor_factory = ProcessorFactory(db)
        result = await processor_factory.process_with_context(task.content, task.context)
        print("Processing result:", result)
        return result
    except Exception as e:
        print("Error processing command:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

# Task endpoints
@app.post("/api/tasks")
async def add_task(task: Dict, token: str = Depends(get_token)):
    return await task_service.add_task(task, token)

@app.get("/api/tasks")
async def get_tasks(token: str = Depends(get_token)):
    try:
        print("Fetching tasks for token")  
        return await task_service.get_tasks(token)
    except Exception as e:
        print(f"Error in get_tasks endpoint: {str(e)}")  
        raise

@app.get("/api/tasks/{task_id}")
async def get_task_by_id(task_id: str, token: str = Depends(get_token)):
    return await task_service.get_task_by_id(task_id, token)

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: Dict, token: str = Depends(get_token)):
    return await task_service.update_task(task_id, task, token)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, token: str = Depends(get_token)):
    return await task_service.delete_task(task_id, token)

# Reminder endpoints

@app.get("/api/reminders")
async def get_reminders(user = Depends(verify_token)):
    try:
        return reminder_service.get_active_reminders()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reminders/{reminder_id}/trigger")
async def trigger_reminder(reminder_id: str, user = Depends(verify_token)):
    try:
        success = reminder_service.mark_reminder_triggered(reminder_id)
        if success:
            return {"message": "Reminder marked as triggered"}
        raise HTTPException(status_code=404, detail="Reminder not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Task reminder endpoints
@app.put("/api/tasks/{task_id}/reminder")
async def add_task_reminder(
    task_id: str,
    reminder: ReminderCreate,
    user = Depends(verify_token)
):
    try:
        print(f"Adding reminder for task {task_id} with data: {reminder}")
        result = reminder_service.add_task_reminder(
            task_id=task_id,
            user_id=user['uid'],
            reminder_time=reminder.reminderTime,
            recurring=reminder.recurring.dict() if reminder.recurring else None
        )
        return result
    except Exception as e:
        print(f"Error adding reminder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}/reminder")
async def remove_task_reminder(
    task_id: str,
    user = Depends(verify_token)
):
    try:
        reminder_service.remove_task_reminder(task_id)
        return {"message": "Reminder removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}/reminders")
async def get_task_reminders(
    task_id: str,
    user = Depends(verify_token)
):
    try:
        reminders = reminder_service.get_task_reminders(task_id)
        return reminders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}/reminder/notification")
async def update_reminder_notification(task_id: str, user = Depends(verify_token)):
    """Mark a reminder's notification as sent"""
    try:
        print(f"Updating notification for task {task_id}")
        reminder = await reminder_service.mark_notification_sent(task_id)
        print(f"Successfully updated notification for task {task_id}")
        return {"success": True}
    except Exception as e:
        print(f"Error updating notification: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# New endpoints for context management
@app.get("/api/context/{context_type}")
async def get_context(context_type: str, request: Request):
    """Get user context by type"""
    try:
        user_id = request.headers.get("user-id", "anonymous")
        context = await context_manager.get_context(user_id, context_type)
        if context is None:
            raise HTTPException(status_code=404, detail="Context not found")
        return context
    except Exception as e:
        print(f"Error in get_context: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/context/{context_type}")
async def store_context(context_type: str, data: dict, request: Request):
    """Store user context by type"""
    try:
        user_id = request.headers.get("user-id", "anonymous")
        success = await context_manager.store_context(user_id, context_type, data)
        if success:
            return {"message": "Context stored successfully"}
        raise HTTPException(status_code=500, detail="Failed to store context")
    except Exception as e:
        print(f"Error in store_context: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/context/{context_type}")
async def clear_context(context_type: str, request: Request):
    """Clear user context by type"""
    try:
        user_id = request.headers.get("user-id", "anonymous")
        success = await context_manager.clear_context(user_id, context_type)
        if success:
            return {"message": "Context cleared successfully"}
        raise HTTPException(status_code=500, detail="Failed to clear context")
    except Exception as e:
        print(f"Error in clear_context: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Conversation endpoints
@app.post("/api/conversations/message")
async def save_message(content: str, sender: str, user = Depends(verify_token)):
    return await conversation_service.save_message(user['uid'], content, sender)

@app.get("/api/conversations/history")
async def get_conversation_history(conversation_id: Optional[str] = None, user = Depends(verify_token)):
    return await conversation_service.get_conversation_history(user['uid'], conversation_id)

@app.post("/api/conversations/new")
async def start_new_conversation(user = Depends(verify_token)):
    return await conversation_service.start_new_conversation(user['uid'])

@app.get("/api/conversations")
async def get_all_conversations(
    page_size: int = 6,
    last_doc: Optional[Dict] = None,
    user = Depends(verify_token)
):
    return await conversation_service.get_all_conversations(user['uid'], page_size, last_doc)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)