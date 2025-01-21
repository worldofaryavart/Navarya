from fastapi import FastAPI, HTTPException, Depends, Request, Response, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth
from models.reminder_models import ReminderCreate, Reminder
from services.task_services import TaskService
from services.reminder_service import ReminderService
from services.processor_factory import ProcessorFactory
from services.conversation_history import ConversationHistoryService, Message, ConversationInfo, ConversationsResponse
from utils.exceptions import TaskException, TaskNotFoundError, UnauthorizedError, ValidationError, DatabaseError
from datetime import datetime
from enum import Enum

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize services
reminder_service = ReminderService(db)
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
    """Verify Firebase ID token from Authorization header"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="No valid authorization header")
        
        token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(token)
        
        return {'uid': decoded_token['uid'], 'token': token}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

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
        return token
    except Exception as e:
        raise UnauthorizedError(f"Token error: {str(e)}")

class Role(str, Enum):
    USER = 'user'
    AI = 'assistant'

class MessageRequest(BaseModel):
    role: Role
    content: str

@app.post("/api/process-command")
async def process_command(message: MessageRequest, user = Depends(verify_token)):
    """Process natural language commands using AI"""
    try:
        user_id = user['uid']
        
        # Get or create active conversation
        conversations = await conversation_service.get_conversation_history(user_id)
        
        if not conversations['conversation']:
            # Start new conversation if none exists
            print("conversation doesn't exist")
            # success = await conversation_service.start_new_conversation(user_id)
            # if not success:
            #     raise HTTPException(status_code=500, detail="Failed to create new conversation")
            # conversations = await conversation_service.get_conversation_history(user_id)
        else:
            # Get the conversation ID from the conversation data
            conversation_id = conversations['conversation']['id']
            print("conversation id is ", conversation_id)
        
        if not conversation_id:
            raise HTTPException(status_code=500, detail="Failed to get active conversation")
        
        # Save user message
        await conversation_service.save_message(user_id, message.content, message.role.value)
        
        # Get conversation context
        context = await conversation_service.get_conversation_context(conversation_id)
        
        # Process command
        processor_factory = ProcessorFactory(db)
        result = await processor_factory.process_with_context(message.content, context, user_id)

        print("result in process _command: ", result)
        
        # Update context with AI response
        context_updates = {
            'last_ai_response': result.get('message', ''),
            'task_results': result.get('data', {})
        }
        await conversation_service.update_conversation_context(conversation_id, context_updates)
        
        # Save AI response
        await conversation_service.save_message(
            user_id,
            result.get('message', 'No response generated'),
            Role.AI.value
        )
        
        return result
    except Exception as e:
        print(f"Error in process_command: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Task endpoints
@app.post("/api/tasks")
async def add_task(task: Dict, user = Depends(verify_token)):
    user_id = user['uid']
    return await task_service.add_task(task, user_id)

@app.get("/api/tasks")
async def get_tasks(user = Depends(verify_token)):
    user_id = user['uid']
    return await task_service.get_tasks(user_id)

@app.get("/api/tasks/{task_id}")
async def get_task_by_id(task_id: str, user = Depends(verify_token)):
    user_id = user['uid']
    return await task_service.get_task_by_id(task_id, user_id)

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: Dict, user = Depends(verify_token)):
    user_id = user['uid']
    return await task_service.update_task(task_id, task, user_id)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, user = Depends(verify_token)):
    user_id = user['uid']
    return await task_service.delete_task(task_id, user_id)

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
async def add_task_reminder(task_id: str, reminder: ReminderCreate, user = Depends(verify_token)):
    try:
        result = reminder_service.add_task_reminder(
            task_id=task_id,
            user_id=user['uid'],
            reminder_time=reminder.reminderTime,
            recurring=reminder.recurring.dict() if reminder.recurring else None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}/reminder")
async def remove_task_reminder(task_id: str, user = Depends(verify_token)):
    try:
        reminder_service.remove_task_reminder(task_id)
        return {"message": "Reminder removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}/reminders")
async def get_task_reminders(task_id: str, user = Depends(verify_token)):
    try:
        return reminder_service.get_task_reminders(task_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}/reminder/notification")
async def update_reminder_notification(task_id: str, user = Depends(verify_token)):
    try:
        await reminder_service.mark_notification_sent(task_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Conversation endpoints
@app.get("/api/conversations/history")
async def get_active_conversation_history(user = Depends(verify_token)):
    return await conversation_service.get_conversation_history(user['uid'])

@app.get("/api/conversations/history/{conversation_id}")
async def get_specific_conversation_history(conversation_id: str, user = Depends(verify_token)):
    return await conversation_service.get_conversation_history(user['uid'], conversation_id)

@app.post("/api/conversations/new")
async def start_new_conversation(user = Depends(verify_token)):
    print("conversation started")
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