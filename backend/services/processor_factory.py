from typing import Dict, Any, Optional, List, Type
from services.command_processor.base_processor import BaseCommandProcessor
from services.command_processor.task_processor import TaskProcessor
from datetime import datetime
import json
import numpy as np
from enum import Enum
import requests
import os
from dataclasses import dataclass
from abc import ABC, abstractmethod

class ProcessorType(Enum):
    TASK = 'tasks'
    EMAIL = 'email'
    CALENDAR = 'calendar'
    CHAT = 'chat'
    GENERAL = 'general'

@dataclass
class Intent:
    domain: ProcessorType
    action: str
    confidence: float
    parameters: Dict[str, Any]

class ContextPromptBuilder:
    """Helper class to build context prompts"""
    def __init__(self):
        self.sections: List[str] = []
    
    def add_conversation_history(self, history: List[Dict[str, Any]]) -> None:
        """Add conversation history to the prompt"""
        history_text = "\nConversation History:"
        for msg in history:
            history_text += f"\n{msg['role'].title()}: {msg['content']}"
            if msg.get('result'):
                history_text += f"\nAction: {json.dumps(msg['result'], indent=2)}"
        self.sections.append(history_text)
    
    def add_action_context(self, action: str, result: Dict[str, Any]) -> None:
        """Add last action and its result to the prompt"""
        self.sections.append(f"\nLast Action: {action}")
        if result:
            self.sections.append(f"Result: {json.dumps(result, indent=2)}")
    
    def add_domain_context(self, domain: str, data: Any) -> None:
        """Add domain-specific context to the prompt"""
        self.sections.append(f"\n{domain.title()} Context:")
        self.sections.append(json.dumps(data, indent=2))
    
    def add_time_context(self, current_time: datetime) -> None:
        """Add current time context to the prompt"""
        self.sections.append(f"\nCurrent Time: {current_time.isoformat()}")
    
    def add_instructions(self, instructions: List[str]) -> None:
        """Add processing instructions to the prompt"""
        self.sections.append("\nInstructions:")
        for instruction in instructions:
            self.sections.append(f"- {instruction}")
    
    def build(self) -> str:
        """Build the final prompt string"""
        return "\n".join(self.sections)

class ProcessorFactory:
    def __init__(self, db):
        self.db = db
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")
            
        self._processors: Dict[ProcessorType, BaseCommandProcessor] = {
            ProcessorType.TASK: TaskProcessor(db),
            # Add more processors as needed
        }
        
        # Cache for embeddings
        self._embedding_cache: Dict[str, List[float]] = {}
        
        # Define actions that likely need follow-ups
        self._followup_likely_actions = {
            'list_tasks': True,
            'create_task': True,
            'search_tasks': True,
            'show_details': True,
            'filter_results': True
        }

    async def get_processor(self, message: str) -> BaseCommandProcessor:
        """Get appropriate processor using AI intent detection"""
        try:
            intent = await self._detect_intent(message)
            return self._processors.get(intent.domain, self._processors[ProcessorType.TASK])
        except Exception as e:
            print(f"Error detecting processor: {e}")
            return self._processors[ProcessorType.TASK]

    async def process_with_context(self, message: str, context: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Process a message with conversation context"""
        try:
            # Check if it's a follow-up question
            is_followup = await self._is_followup_question(message, context)
            
            if is_followup:
                message = await self._resolve_followup_reference(message, context)
                print(f"Resolved follow-up message: {message}")

            # Get processor based on intent
            processor = await self.get_processor(message)
            
            # Build context prompt
            context_prompt = await self._build_context_prompt(message, context)
            
            # Process message
            print("ready to process in prcessor factory.. \n\n")
            result = await processor.process_message(
                message=message,
                context_prompt=context_prompt,
                conversation_context=context, 
                user_token=user_token
            )

            # Enhance result with follow-up handling
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
        """Build a comprehensive context prompt for the AI"""
        prompt_builder = ContextPromptBuilder()
        
        # Add conversation history
        if context.get('conversation_history'):
            prompt_builder.add_conversation_history(context['conversation_history'][-5:])
        
        # Add active context
        if context.get('last_action'):
            prompt_builder.add_action_context(
                action=context['last_action'],
                result=context.get('last_action_result', {})
            )
        
        # Add domain-specific context
        if context.get('tasks'):
            prompt_builder.add_domain_context('tasks', context['tasks'])
        
        # Add time context
        prompt_builder.add_time_context(datetime.utcnow())
        
        # Add dynamic instructions
        prompt_builder.add_instructions(self._get_dynamic_instructions(context))
        
        return prompt_builder.build()

    def _get_dynamic_instructions(self, context: Dict[str, Any]) -> List[str]:
        """Get dynamic instructions based on context"""
        instructions = [
            "Maintain context from previous messages when relevant",
            "Consider task status, priority, and due dates",
            "Handle relative time references (today, tomorrow, next week)",
            "Reference previous tasks or actions when mentioned",
            "Resolve pronouns (it, that, this) based on context"
        ]
        
        # Add context-specific instructions
        if context.get('last_action') == 'list_tasks':
            instructions.extend([
                "Reference tasks by their listed numbers or names",
                "Allow filtering and sorting of the previously listed tasks"
            ])
        elif context.get('last_action') == 'create_task':
            instructions.extend([
                "Allow modifications to the recently created task",
                "Support adding additional details or subtasks"
            ])
            
        return instructions

    async def _detect_intent(self, message: str) -> Intent:
        """Use AI to detect message intent and domain"""
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
                        {
                            "role": "system",
                            "content": "Analyze the user message and classify its intent. Respond in JSON format with domain, action, confidence, and parameters."
                        },
                        {"role": "user", "content": message}
                    ],
                    "max_tokens": 200,
                    "temperature": 0.3
                }
            )
            
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

    async def _get_embedding(self, text: str) -> List[float]:
        """Get text embedding using AI model"""
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
        """Calculate cosine similarity between two embeddings"""
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
        """Use AI to detect if message is a follow-up"""
        if not context.get('last_action'):
            return False

        # Get embeddings for current and previous context
        message_embedding = await self._get_embedding(message)
        context_embedding = await self._get_embedding(
            f"{context.get('last_message', '')} {context.get('last_response', '')}"
        )
        
        # Calculate similarity
        similarity = self._calculate_similarity(message_embedding, context_embedding)
        
        # High similarity indicates follow-up
        if similarity > 0.8:
            return True
            
        # Fallback to rule-based detection
        return self._rule_based_followup_detection(message)

    def _rule_based_followup_detection(self, message: str) -> bool:
        """Fallback rule-based follow-up detection"""
        message_lower = message.lower()
        
        # Standalone commands that are not follow-ups
        standalone_commands = {
            'show me today', 'show today', 'show me tomorrow',
            'show me yesterday', 'show me upcoming', 'show me all',
            'show me pending', 'show me completed'
        }
        
        if any(cmd in message_lower for cmd in standalone_commands):
            return False
            
        # Check for follow-up indicators
        followup_indicators = {
            'it', 'that', 'this', 'the task', 'the reminder',
            'change', 'modify', 'update', 'delete', 'remove'
        }
        
        return any(indicator in message_lower for indicator in followup_indicators)

    async def _resolve_followup_reference(self, message: str, context: Dict[str, Any]) -> str:
        """Use AI to resolve references in follow-up questions"""
        if not context.get('last_action'):
            return message

        try:
            # Create prompt for reference resolution
            prompt = f"""
            Previous Context:
            User: {context.get('last_message')}
            Assistant: {context.get('last_response')}
            Action: {context.get('last_action')}
            Result: {json.dumps(context.get('last_action_result', {}))}

            Current Message: {message}

            Resolve any references in the current message to create a self-contained command.
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
        """Predict if the current action might lead to follow-up questions"""
        return self._followup_likely_actions.get(result.get('action', ''), False)

class ConversationContext:
    def __init__(self):
        self.messages: List[Dict[str, Any]] = []
        self.max_context_length = 10  # Keep last 10 messages for context
        
    def add_message(self, role: str, content: str, result: Optional[Dict] = None):
        """Add a message to the conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        }
        if result:
            message["result"] = result
            
        self.messages.append(message)
        if len(self.messages) > self.max_context_length:
            self.messages.pop(0)
            
    def get_context_prompt(self) -> str:
        """Generate a context prompt from conversation history"""
        if not self.messages:
            return ""
            
        prompt = "\nConversation History:\n"
        for msg in self.messages:
            prompt += f"{msg['role'].title()}: {msg['content']}\n"
            if msg.get('result'):
                prompt += f"Action: {json.dumps(msg['result'], indent=2)}\n"
        return prompt
        
    def clear(self):
        """Clear conversation history"""
        self.messages = []
