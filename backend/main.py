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
from services.context_manager import ContextManager, ContextType
from services.conversation_history import ConversationHistoryService
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
    """Verify Firebase ID token from Authorization header"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="No valid authorization header")
        
        token = auth_header.split(' ')[1]
        decoded_token = firebase_admin.auth.verify_id_token(token)
        
        # Include both uid and the original token in the returned object
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
        print(f"Extracted token: {token[:10]}...")  
        return token
    except Exception as e:
        print(f"Token extraction error: {str(e)}")  
        raise UnauthorizedError(f"Token error: {str(e)}")

# Task Models
class Role(str, Enum):
    USER = 'user'
    AI = 'assistant'

class Message(BaseModel):
    role: Role
    content: str
    timestamp: datetime

# class TaskBase(BaseModel):
#     content: str
#     role: 'user' | 'ai'
#     timestamp: datetime


# class TaskCreate(TaskBase):
#     pass

# class Task(TaskBase):
#     id: str
    # user_id: str

@app.post("/api/process-command")
async def process_command(message: Message, user = Depends(verify_token)):
    """Process natural language commands using AI"""
    try:
        user_id = user['uid']
        
        # 1. Save the user's message
        await conversation_service.save_message(user_id, message.content, message.role.value)
        
        # 2. Update context with user's message
        context_manager = ContextManager(db)
        session_context = await context_manager.get_context(user_id, ContextType.SESSION) or {}
        
        # Update session context with current message
        if 'conversation_history' not in session_context:
            session_context['conversation_history'] = []
        session_context['conversation_history'].append({
            'message': message.content,
            'timestamp': datetime.utcnow().isoformat(),
            'role': 'user'
        })
        print("session_context:", session_context)
        await context_manager.store_context(user_id, ContextType.SESSION, session_context)
        
        # 3. Process the message with merged context
        processor_factory = ProcessorFactory(db)
        merged_context = await context_manager.merge_contexts(user_id)
        print("merged context: ", merged_context)
        result = await processor_factory.process_with_context(message.content, merged_context)
        
        print("AI processing result:", result)
        
        # 4. Handle task operations based on the action
        task_service = TaskService(db)
        if result.get('success') and result.get('action'):
            action = result['action']
            data = result.get('data', {})
            
            if action == 'create_task':
                task_result = await task_service.add_task(data, user['token'])
                result['data'] = task_result
            
            elif action == 'list_tasks':
                tasks = await task_service.get_tasks(user['token'])
                if data.get('filter'):
                    # Apply filters from the AI result
                    filter_criteria = data['filter']
                    if filter_criteria.get('status'):
                        tasks = [t for t in tasks if t.get('status') == filter_criteria['status']]
                    if filter_criteria.get('priority'):
                        tasks = [t for t in tasks if t.get('priority') == filter_criteria['priority']]
                    # Add more filters as needed
                result['data'] = tasks
            
            elif action == 'update_task':
                if data.get('description') and data.get('updates'):
                    # Find task by description
                    tasks = await task_service.get_tasks(user['token'])
                    task_to_update = next(
                        (t for t in tasks if t['title'].lower() in data['description'].lower()),
                        None
                    )
                    if task_to_update:
                        task_result = await task_service.update_task(
                            task_to_update['id'],
                            {**task_to_update, **data['updates']},
                            user['token']
                        )
                        result['data'] = task_result
            
            elif action == 'delete_task':
                if data.get('description'):
                    # Find task by description
                    tasks = await task_service.get_tasks(user['token'])
                    task_to_delete = next(
                        (t for t in tasks if t['title'].lower() in data['description'].lower()),
                        None
                    )
                    if task_to_delete:
                        await task_service.delete_task(task_to_delete['id'], user['token'])
                        result['data'] = {'deleted': task_to_delete['id']}
            
            elif action == 'batch_operations':
                if data.get('operations'):
                    batch_results = []
                    for op in data['operations']:
                        if op['type'] == 'create_task':
                            task_result = await task_service.add_task(op['data'], user['token'])
                            batch_results.append({'type': 'create', 'result': task_result})
                        # Add other batch operations as needed
                    result['data'] = {'batch_results': batch_results}
        
        # 5. Update context with AI response and task results
        session_context['conversation_history'].append({
            'message': result['message'],
            'timestamp': datetime.utcnow().isoformat(),
            'role': 'assistant'
        })
        await context_manager.store_context(user_id, ContextType.SESSION, session_context)
        
        # 6. Save the AI response message
        await conversation_service.save_message(user_id, result['message'], 'assistant')
        
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

@app.get("/api/conversations/history/")
async def get_active_conversation_history(user = Depends(verify_token)):
    return await conversation_service.get_conversation_history(user['uid'])

@app.get("/api/conversations/history/{conversation_id}")
async def get_specific_conversation_history(conversation_id: str, user = Depends(verify_token)):
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