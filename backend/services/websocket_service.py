import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
from datetime import datetime
import pytz

class WebSocketService:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.timezone = pytz.timezone('Asia/Kolkata')

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_notification(self, user_id: str, task_data: dict):
        if user_id not in self.active_connections:
            return

        message = {
            "type": "reminder",
            "task": task_data,
            "timestamp": datetime.now(self.timezone).isoformat()
        }

        # Send to all active connections for this user
        websockets = self.active_connections[user_id].copy()
        for websocket in websockets:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception:
                # If sending fails, remove the connection
                self.disconnect(websocket, user_id)

    async def broadcast_task_update(self, user_id: str, task_data: dict, update_type: str):
        if user_id not in self.active_connections:
            return

        message = {
            "type": "task_update",
            "updateType": update_type,  # "create", "update", or "delete"
            "task": task_data,
            "timestamp": datetime.now(self.timezone).isoformat()
        }

        websockets = self.active_connections[user_id].copy()
        for websocket in websockets:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception:
                self.disconnect(websocket, user_id)

# Global instance
websocket_service = WebSocketService()
