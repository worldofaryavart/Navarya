from typing import Dict, Any, List
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import json
import os
import requests
import numpy as np
from services.command_processor.task_processor import TaskProcessor

from dotenv import load_dotenv
load_dotenv()

# Enum for processor domains
class ProcessorType(Enum):
    TASK = 'tasks'
    EMAIL = 'email'
    CALENDAR = 'calendar'
    CHAT = 'chat'
    GENERAL = 'general'

# Data class to hold intent information
@dataclass
class Intent:
    domain: ProcessorType
    action: str
    confidence: float

# Factory for creating and managing processors
class ProcessorFactory:
    def __init__(self, db):
        self.db = db
        # Load together API key for additional services (e.g., embeddings)
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        self.DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
        if not self.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")
            
        # Initialize your processor instances
        self._processors: Dict[ProcessorType, Any] = {
            ProcessorType.TASK: TaskProcessor(db),
            # Add additional processors as needed
        }
        
        # Cache for embeddings to avoid duplicate API calls
        self._embedding_cache: Dict[str, List[float]] = {}
        
        # Actions that might trigger follow-up questions
        self._followup_likely_actions = {
            'list_tasks': True,
            'create_task': True,
            'search_tasks': True,
            'show_details': True,
            'filter_results': True
        }
    
    async def get_processor(self, message: str) -> Any:
        """Determine the appropriate processor using intent detection."""
        try:
            intent = await self._detect_intent(message)
            print("Detected intent:", intent)
            # Return the processor corresponding to the detected domain or a default
            return self._processors.get(intent.domain, self._processors[ProcessorType.TASK]), intent
        except Exception as e:
            print(f"Error detecting processor: {e}")
            return self._processors[ProcessorType.TASK]
        
    async def _detect_intent(self, message: str) -> Intent:
        """Use DeepSeek AI to detect the intent from the user message."""
        try:
            # Build a prompt that instructs the AI to determine intent
            prompt = self._build_prompt_intent(message)
            url = "https://api.deepseek.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            }

            data = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": (
                        "You are an AI specialized in intent detection. "
                        "Extract the intent from the user's message. "
                        "Return a JSON object with these keys: "
                        "domain (as one of [tasks, email, calendar, chat, general]), "
                        "action (a descriptive string), "
                        "confidence (a decimal number between 0 and 1), "
                        "Ensure the output is valid JSON."
                    )},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 100,
                "response_format": {"type": "json_object"}
            }

            response = requests.post(url, json=data, headers=headers)
            result = response.json()

            print(result['choices'][0]['message']['content'])

            # Check for a valid response and extract the content
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                intent_data = json.loads(content)
                return Intent(
                    domain=ProcessorType(intent_data['domain']),
                    action=intent_data['action'],
                    confidence=float(intent_data['confidence'])
                )
            else:
                # Fallback intent
                return Intent(
                    domain=ProcessorType.TASK,
                    action='unknown',
                    confidence=0.0
                )
        except Exception as e:
            print(f"Error detecting intent: {e}")
            return Intent(
                domain=ProcessorType.TASK,
                action='unknown',
                confidence=0.0,
            )

    async def process_with_context(
        self, message: str, context: Dict[str, Any], user_token: str
    ) -> Dict[str, Any]:
        """Process a message along with conversation context."""
        try:
            # Retrieve the processor based on intent
            processor, intent = await self.get_processor(message)
            print("\n\n\n")
            print("processor is : ", processor)
            print("intent is : ", intent)
            
            # Build a context prompt for the AI
            print("details that are necessary to know: ")
            print("message is: ", message)
            print("context is: ", context)
            print("user token is: ", user_token)

            
            # Process the message with the selected processor
            result = await processor.process_message(
                intent= intent,
                message=message,
                conversation_context=context, 
                user_token=user_token
            )
            
            return result

        except Exception as e:
            print(f"Error processing message: {e}")
            return {
                'success': False,
                'message': 'Error processing your request. Please try again.',
                'error': str(e)
            }

    def _get_dynamic_instructions(self, context: Dict[str, Any]) -> List[str]:
        """Produce additional dynamic instructions based on the context."""
        instructions = [
            "Maintain context from previous messages when relevant.",
            "Consider task status, priority, and due dates.",
            "Handle relative time references (today, tomorrow, etc.).",
            "Reference previous tasks or actions when mentioned.",
            "Resolve pronouns (it, that, this) based on context."
        ]
        
        # Enhance instructions based on the last action
        if context.get('last_action') == 'list_tasks':
            instructions.extend([
                "Reference tasks by their listed numbers or names.",
                "Allow filtering and sorting of the previously listed tasks."
            ])
        elif context.get('last_action') == 'create_task':
            instructions.extend([
                "Allow modifications to the recently created task.",
                "Support adding additional details or subtasks."
            ])
            
        return instructions

    def _build_prompt_intent(self, message: str) -> str:
        """
        Build a prompt that clearly instructs the AI on how to interpret the user's message.
        """
        prompt = (
            f"User message: \"{message}\"\n"
            "Please analyze the user's intent. "
            "Return a JSON with 'domain', 'action', 'confidence'."
        )
        return prompt
