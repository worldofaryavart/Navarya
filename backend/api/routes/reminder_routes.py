from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Any
from ..dependencies import get_current_user
from ...services.task_service import TaskService
from ...services.websocket_service import websocket_service

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Depends(get_current_user)
):
    await websocket_service.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_service.disconnect(websocket, user_id)

@router.put("/tasks/{task_id}/reminder")
async def add_reminder(
    task_id: str,
    reminder_data: Dict[str, Any],
    user_id: str = Depends(get_current_user),
    task_service: TaskService = Depends()
):
    try:
        await task_service.add_reminder(task_id, reminder_data, user_id)
        return {"success": True, "message": "Reminder added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tasks/{task_id}/reminder")
async def remove_reminder(
    task_id: str,
    user_id: str = Depends(get_current_user),
    task_service: TaskService = Depends()
):
    try:
        await task_service.remove_reminder(task_id, user_id)
        return {"success": True, "message": "Reminder removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tasks/{task_id}/reminder/notification")
async def update_notification_status(
    task_id: str,
    user_id: str = Depends(get_current_user),
    task_service: TaskService = Depends()
):
    try:
        await task_service.mark_notification_sent(task_id)
        return {"success": True, "message": "Notification status updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
