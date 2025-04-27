import os
from typing import Dict, Any, Optional
import requests
from datetime import datetime
import time
from abc import ABC, abstractmethod
from google.cloud.firestore import Increment

class BaseCommandProcessor(ABC):
    def __init__(self, db):
        self.db = db
        self.DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
        if not self.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")

    def firestore_object_handler(self, obj):
        if isinstance(obj, Increment):
            return str(obj._value)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    @abstractmethod
    def get_system_prompt_subdomain(self, message: str, conversation_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Build and return the system prompt for subdomain detection.
        The prompt instructs the AI to choose from create_tasks, list_tasks, update_tasks, delete_tasks.
        """
        pass

    @abstractmethod
    def _parse_natural_language(self, message: str) -> Dict[str, Any]:
        """Parse natural language into structured task data"""
        pass

    @abstractmethod
    async def process_ai_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Process the AI's JSON output into the final structured response"""
        pass

    async def process_message(
        self,
        intent: Dict[str, Any],
        message: str,
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            # Build system prompt correctly without passing self twice
            system_prompt = self.get_system_prompt_subdomain(message, conversation_context)

            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 100,
                "response_format": {"type": "json_object"}
            }
            headers = {
                "Authorization": f"Bearer {self.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            }

            response = requests.post("https://api.deepseek.com/v1/chat/completions", json=payload, headers=headers)

            if response.status_code != 200:
                return {"success": False, "message": f"API error: {response.text}"}

            ai_payload = response.json()
            choice = ai_payload.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            if not choice:
                return {"success": False, "message": "Empty response from AI"}
            # Process and return final result
            return choice

        except Exception as e:
            return {"success": False, "message": f"Error in process_message: {e}"}
