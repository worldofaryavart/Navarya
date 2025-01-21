import os
from typing import Dict, Any, Optional
import json
import requests
from datetime import datetime
import time
from abc import ABC, abstractmethod
from google.cloud.firestore import Increment

class BaseCommandProcessor(ABC):
    def __init__(self, db):
        self.db = db
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        self.last_api_call = 0
        self.min_interval = 5
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")

    def firestore_object_handler(self, obj):
        if isinstance(obj, Increment):
            return str(obj._value)  # Convert Increment to its value
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this processor"""
        pass

    @abstractmethod
    def _parse_natural_language(self, message: str) -> Dict[Any, Any]:
        """Parse natural language into structured data"""
        pass

    @abstractmethod
    async def process_ai_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Process the AI response and return structured data"""
        pass

    async def process_message(
        self, 
        message: str, 
        context_prompt: str = "",
        conversation_context: Optional[Dict[str, Any]] = None
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

Conversation Context:
{json.dumps(conversation_context, indent=2, default=self.firestore_object_handler) if conversation_context else "No context available"}

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
   - context_updates: any updates that should be made to the conversation context

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
            print("\n\n")
            print("Raw AI response:", ai_response)
            print("\n\n")
            
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
                print("intent is : ", intent)
                print("\n\n")
                
                # Get everything after the intent JSON
                response_str = parts[1].split('}', 1)[1].strip()
                print("response_str is : ", response_str)
                print("\n\n")
                
                def extract_json_object(text):
                    # Find the first opening brace
                    start_idx = text.find('{')
                    if start_idx == -1:
                        return None
                    
                    # Initialize counters
                    brace_count = 0
                    in_string = False
                    escape_next = False
                    
                    # Find the matching closing brace
                    for i in range(start_idx, len(text)):
                        char = text[i]
                        
                        if escape_next:
                            escape_next = False
                            continue
                            
                        if char == '\\':
                            escape_next = True
                            continue
                            
                        if char == '"' and not escape_next:
                            in_string = not in_string
                            continue
                            
                        if not in_string:
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    # Found complete JSON object
                                    return text[start_idx:i + 1]
                    
                    return None
                
                # Extract just the JSON object
                json_str = extract_json_object(response_str)
                if not json_str:
                    return {
                        "success": False,
                        "message": "No valid JSON object found in response"
                    }
                
                print("Extracted JSON string:", json_str)
                print("\n\n")
                
                try:
                    # Parse the JSON object
                    response = json.loads(json_str)
                    
                    # Convert any integer keys to strings in context_updates if they exist
                    if 'context_updates' in response and 'task_results' in response['context_updates']:
                        task_results = response['context_updates']['task_results']
                        if isinstance(task_results, dict):
                            response['context_updates']['task_results'] = {
                                str(k): v for k, v in task_results.items()
                            }
                    
                    print("response is : ", response)
                    print("\n\n")
                    
                    # Get any text after the JSON object as additional data
                    json_end_idx = response_str.find(json_str) + len(json_str)
                    additional_data = response_str[json_end_idx:].strip()
                    
                    # Process the AI response
                    if 'context_updates' in response:
                        # Convert any Firestore types in context_updates to serializable format
                        response['context_updates'] = json.loads(
                            json.dumps(response['context_updates'], default=self.firestore_object_handler)
                        )
                    
                    #adding intent in result
                    ai_result = {
                        "success": True,
                        "intent": intent, 
                        "response": response,
                    }
                    
                    if additional_data:
                        ai_result["additional_data"] = additional_data
                        
                    print("ai_result in base processor is : ", ai_result)
                    print("\n\n")
                    
                    return ai_result
                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {e}")
                    print(f"Problematic JSON string: {json_str}")
                    return {
                        "success": False,
                        "message": "Failed to parse AI response",
                        "error_details": str(e)
                    }
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
