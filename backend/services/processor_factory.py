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
# Ensure your .env is loaded early (if you use dotenv in other modules as well)
load_dotenv()

# Import asynchronous OpenAI client
# from openai import AsyncOpenAI

# Set up your DeepSeek API key and client configuration
# client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.ai")


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
    parameters: Dict[str, Any]

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
            return self._processors.get(intent.domain, self._processors[ProcessorType.TASK])
        except Exception as e:
            print(f"Error detecting processor: {e}")
            return self._processors[ProcessorType.TASK]

    async def process_with_context(
        self, message: str, context: Dict[str, Any], user_token: str
    ) -> Dict[str, Any]:
        """Process a message along with conversation context."""
        try:
            # Determine if the message is a follow-up and resolve references if needed
            is_followup = await self._is_followup_question(message, context)
            if is_followup:
                message = await self._resolve_followup_reference(message, context)
                print(f"Resolved follow-up message: {message}")

            # Retrieve the processor based on intent
            processor = await self.get_processor(message)
            print("processor is : ", processor)
            
            # Build a context prompt for the AI
            context_prompt = await self._build_context_prompt(message, context)

            print("details that are necessary to know: ")
            print("\n\n\n")
            print("context prompt is: ", context_prompt)
            print("message is: ", message)
            print("context is: ", context)
            print("user token is: ", user_token)
            print("\n\n\n")

            
            # Process the message with the selected processor
            result = await processor.process_message(
                message=message,
                context_prompt=context_prompt,
                conversation_context=context, 
                user_token=user_token
            )

            # Enhance result with follow-up information
            result['expects_followup'] = self._might_expect_followup(result)
            result['was_followup'] = is_followup
            
            return result

        except Exception as e:
            print(f"Error processing message: {e}")
            return {
                'success': False,
                'message': 'Error processing your request. Please try again.',
                'error': str(e)
            }

    async def _build_context_prompt(self, message: str, context: Dict[str, Any]) -> str:
        """Construct a comprehensive context prompt for the AI."""
        # Example: using a separate prompt builder class might make sense,
        # but here we combine elements directly.
        prompt_lines = []

        # Add a short conversation history if available
        if context.get('conversation_history'):
            history = context['conversation_history'][-5:]
            prompt_lines.append("Conversation history:")
            for line in history:
                prompt_lines.append(line)
        
        # Include the last action and its result if available
        if context.get('last_action'):
            prompt_lines.append(f"Last action: {context['last_action']}")
            prompt_lines.append(f"Result: {json.dumps(context.get('last_action_result', {}))}")
        
        # Domain-specific context (example for tasks)
        if context.get('tasks'):
            prompt_lines.append("Tasks:")
            prompt_lines.append(json.dumps(context['tasks']))
        
        # Add time context
        prompt_lines.append(f"Current time (UTC): {datetime.utcnow().isoformat()}")

        # Dynamic instructions for the AI
        dynamic_instructions = self._get_dynamic_instructions(context)
        if dynamic_instructions:
            prompt_lines.append("Instructions:")
            prompt_lines.extend(dynamic_instructions)
        
        return "\n".join(prompt_lines)

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

    async def _detect_intent(self, message: str) -> Intent:
        """Use DeepSeek AI to detect the intent from the user message."""
        try:
            # Build a prompt that instructs the AI to determine intent
            prompt = self._build_prompt_intent(message)
            print("Intent detection prompt:", prompt)
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
                        "and parameters (an object with additional details if any). "
                        "Ensure the output is valid JSON."
                    )},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 100,
                "response_format": {"type": "json_object"}
            }

            response = requests.post(url, json=data, headers=headers)
            print("\n\n")
            print("response is ", response)
            result = response.json()
            print("Intent detection response:", result)

            print(result['choices'][0]['message']['content'])

            # Check for a valid response and extract the content
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                intent_data = json.loads(content)
                return Intent(
                    domain=ProcessorType(intent_data['domain']),
                    action=intent_data['action'],
                    confidence=float(intent_data['confidence']),
                    parameters=intent_data.get('parameters', {})
                )
            else:
                # Fallback intent
                return Intent(
                    domain=ProcessorType.TASK,
                    action='unknown',
                    confidence=0.0,
                    parameters={}
                )
        except Exception as e:
            print(f"Error detecting intent: {e}")
            return Intent(
                domain=ProcessorType.TASK,
                action='unknown',
                confidence=0.0,
                parameters={}
            )

    def _build_prompt_intent(self, message: str) -> str:
        """
        Build a prompt that clearly instructs the AI on how to interpret the user's message.
        """
        prompt = (
            f"User message: \"{message}\"\n"
            "Please analyze the user's intent. "
            "Return a JSON with 'domain', 'action', 'confidence', and 'parameters'."
        )
        return prompt

    async def _get_embedding(self, text: str) -> List[float]:
        """Retrieve embedding for a given text (with caching)."""
        if text in self._embedding_cache:
            return self._embedding_cache[text]
            
        try:
            response = requests.post(
                "https://api.together.xyz/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "togethercomputer/m2-bert-80M-8k-base",
                    "input": text
                }
            )
            if response.status_code == 200:
                embedding = response.json()['data'][0]['embedding']
                self._embedding_cache[text] = embedding
                return embedding
            else:
                return []
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return []

    def _calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings."""
        if not embedding1 or not embedding2:
            return 0.0

        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
            return float(similarity)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0

    async def _is_followup_question(self, message: str, context: Dict[str, Any]) -> bool:
        """Determine if the current message is a follow-up to a previous context."""
        if not context.get('last_action'):
            return False

        # Retrieve embeddings for the current message and last context
        message_embedding = await self._get_embedding(message)
        context_text = f"{context.get('last_message', '')} {context.get('last_response', '')}"
        context_embedding = await self._get_embedding(context_text)
        
        similarity = self._calculate_similarity(message_embedding, context_embedding)
        if similarity > 0.8:
            return True

        # Fallback: use basic rule-based detection
        return self._rule_based_followup_detection(message)

    def _rule_based_followup_detection(self, message: str) -> bool:
        """Basic rules to determine if a message is a follow-up."""
        message_lower = message.lower()
        standalone_commands = {
            'show me today', 'show today', 'show me tomorrow',
            'show me yesterday', 'show me upcoming', 'show me all',
            'show me pending', 'show me completed'
        }
        if any(cmd in message_lower for cmd in standalone_commands):
            return False

        followup_indicators = {
            'it', 'that', 'this', 'the task', 'the reminder',
            'change', 'modify', 'update', 'delete', 'remove'
        }
        return any(indicator in message_lower for indicator in followup_indicators)

    async def _resolve_followup_reference(self, message: str, context: Dict[str, Any]) -> str:
        """Resolve ambiguous references in follow-up questions using AI."""
        if not context.get('last_action'):
            return message

        prompt = (
            "Given the previous conversation context, resolve any ambiguous references "
            "in the following user message to produce a self-contained command.\n\n"
            f"Previous Context:\nUser: {context.get('last_message')}\n"
            f"Assistant: {context.get('last_response')}\n"
            f"Action: {context.get('last_action')}\n"
            f"Result: {json.dumps(context.get('last_action_result', {}))}\n\n"
            f"Current Message: {message}"
        )
        try:
            response = requests.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": message}
                    ],
                    "max_tokens": 200,
                    "temperature": 0.3
                }
            )
            
            if response.status_code == 200:
                resolved = response.json()['choices'][0]['message']['content'].strip()
                return resolved if resolved else message
            else:
                return message
        except Exception as e:
            print(f"Error resolving references: {e}")
            return message

    def _might_expect_followup(self, result: Dict[str, Any]) -> bool:
        """Check if the current action is likely to trigger follow-up questions."""
        return self._followup_likely_actions.get(result.get('action', ''), False)
