import os
from typing import Dict, Any, Optional
import json
import requests
from datetime import datetime
import time
from abc import ABC, abstractmethod

class BaseCommandProcessor(ABC):
    def __init__(self, db):
        self.db = db
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        self.last_api_call = 0
        self.min_interval = 5
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this processor"""
        pass

    @abstractmethod
    def _parse_natural_language(self, message: str) -> Dict[Any, Any]:
        """Parse natural language into structured data"""
        pass

    @abstractmethod
    def process_ai_response(self, content: str) -> Dict[Any, Any]:
        """Process the AI response"""
        pass

    async def process_message(
        self, 
        message: str, 
        context_prompt: str = "",
        session_context: Optional[Dict] = None, 
        persistent_context: Optional[Dict] = None, 
        current_time: Optional[str] = None
    ) -> Dict[Any, Any]:
        try:
            current_time = time.time()
            
            if current_time - self.last_api_call < self.min_interval:
                print("Rate limited, using fallback parser")
                return self._parse_natural_language(message)
                
            print("Received message:", message)
            self.last_api_call = current_time

            # Build the complete system prompt
            system_prompt = f"""System: {self.get_system_prompt()}

Current Date: {datetime.now().strftime("%Y-%m-%d")}

{context_prompt}

Instructions for AI Response:
1. First, classify the user's intent using this format:
INTENT CLASSIFICATION:
{{
    "domain": "tasks|email|browser|conversation",
    "intent": "specific_intent",
    "confidence": 0.0 to 1.0
}}

2. Then, process the command and generate a response that:
   - Is consistent with previous context and conversation history
   - Handles any references to previous messages or actions
   - Provides clear and actionable results
   - Maintains state and context for future interactions

3. Format your response as a JSON object with:
   - success: boolean indicating if the command was successful
   - action: the action taken (e.g., "list_tasks", "create_task")
   - data: any relevant data or filter criteria
   - message: a natural language response to the user

User Message: {message}
"""

            response = requests.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.7,
                }
            )
            
            print("API Response status:", response.status_code)
            
            if response.status_code != 200:
                print("API Error:", response.text)
                return {
                    "success": False,
                    "message": "Failed to process the request. Please try again."
                }

            ai_response = response.json()
            print("Raw AI response:", ai_response)
            
            if not ai_response.get('choices') or not ai_response['choices'][0].get('message'):
                return {
                    "success": False,
                    "message": "Invalid response from AI model"
                }

            content = ai_response['choices'][0]['message']['content'].strip()
            print("content is : ", content)
            
            # Split the response into intent and command parts
            parts = content.split("INTENT CLASSIFICATION:")
            if len(parts) != 2:
                return {
                    "success": False,
                    "message": "Invalid response format"
                }
            
            try:
                # Extract intent from the first JSON block in the response
                intent_str = parts[1].split('}')[0] + '}'
                intent = json.loads(intent_str)
                
                # Process the command response
                print("parts[1]", parts[1].split('}', 1)[1].strip())
                command_response = self.process_ai_response(parts[1].split('}', 1)[1].strip())
                command_response['intent'] = intent
                
                return command_response
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "message": "Failed to parse AI response"
                }

        except Exception as e:
            print("Error in process_message:", str(e))
            return {
                "success": False,
                "message": f"An error occurred: {str(e)}"
            }
