from typing import Dict, Any, Optional, List
from services.command_processor.base_processor import BaseCommandProcessor
from services.command_processor.task_processor import TaskProcessor
from datetime import datetime
import json

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

class ProcessorFactory:
    def __init__(self, db):
        self.db = db
        self._processors: Dict[str, BaseCommandProcessor] = {
            'tasks': TaskProcessor(db),
        }
        self.conversation_context = ConversationContext()

    async def get_processor(self, message: str) -> BaseCommandProcessor:
        """Get the appropriate processor based on message intent"""
        # For now, return task processor as default
        # In future, implement intent detection to choose processor
        return self._processors['tasks']

    def register_processor(self, domain: str, processor: BaseCommandProcessor):
        """Register a new processor for a domain"""
        self._processors[domain] = processor

    async def process_with_context(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a message with context awareness"""
        try:
            # Get appropriate processor
            processor = await self.get_processor(message)

            # Extract relevant context
            session_context = context.get('session', {}) if context else {}
            persistent_context = context.get('persistent', {}) if context else {}
            current_time = context.get('currentTime') if context else None

            # Build comprehensive context prompt
            context_prompt = self._build_context_prompt(
                message, 
                session_context, 
                persistent_context, 
                current_time
            )

            # Process message with context
            result = await processor.process_message(
                message,
                context_prompt=context_prompt,
                session_context=session_context,
                persistent_context=persistent_context,
                current_time=current_time
            )

            # Update conversation history
            self.conversation_context.add_message("user", message)
            self.conversation_context.add_message("assistant", result.get('message', ''), result)

            return result

        except Exception as e:
            print(f"Error processing message with context: {str(e)}")
            return {
                'success': False,
                'message': 'Error processing your request. Please try again.',
                'error': str(e)
            }

    def _build_context_prompt(
        self, 
        message: str, 
        session_context: Dict,
        persistent_context: Dict,
        current_time: str
    ) -> str:
        """Build a comprehensive context prompt for the AI"""
        prompt_parts = []

        # Add conversation history
        conversation_context = self.conversation_context.get_context_prompt()
        if conversation_context:
            prompt_parts.append(conversation_context)

        # Add session context if available
        if session_context:
            prompt_parts.append(f"\nSession Context:\n{json.dumps(session_context, indent=2)}")

        # Add persistent context if available
        if persistent_context:
            prompt_parts.append(f"\nPersistent Context:\n{json.dumps(persistent_context, indent=2)}")

        # Add current time context
        if current_time:
            prompt_parts.append(f"\nCurrent Time: {current_time}")

        # Add task-specific context hints
        prompt_parts.append("""
Instructions for handling the user message:
1. Maintain context from previous messages when relevant
2. For task-related queries:
   - Consider task status, priority, and due dates
   - Handle relative time references (today, tomorrow, next week)
   - Understand task relationships and dependencies
3. For follow-up questions:
   - Reference previous tasks or actions when mentioned
   - Resolve pronouns (it, that, this) based on context
   - Maintain continuity in multi-turn conversations
4. For complex queries:
   - Break down into subtasks if necessary
   - Consider multiple conditions and filters
   - Maintain consistent behavior across related commands
""")

        return "\n".join(prompt_parts)

    def clear_context(self):
        """Clear the conversation context"""
        self.conversation_context.clear()

    def _is_followup_question(self, message: str) -> bool:
        """Check if the message is a follow-up question"""
        # Basic commands that should not be treated as follow-ups
        standalone_commands = [
            'show me today', 'show today', 'show me tomorrow', 
            'show me yesterday', 'show me upcoming', 'show me all',
            'show me pending', 'show me completed'
        ]
        
        message_lower = message.lower()
        
        # If message matches any standalone command, it's not a follow-up
        if any(cmd in message_lower for cmd in standalone_commands):
            return False
            
        # Check for pronouns and references that indicate follow-up
        followup_indicators = [
            'it', 'that', 'this', 'the task', 'the reminder',
            'change', 'modify', 'update', 'delete', 'remove'
        ]
        
        return any(indicator in message_lower for indicator in followup_indicators)

    def _resolve_followup_reference(self, message: str, last_command: Dict[str, Any]) -> str:
        """Resolve references in follow-up questions using context"""
        message_lower = message.lower()

        # Handle different types of follow-ups
        if any(word in message_lower for word in ['change', 'modify', 'update']):
            return f"update {last_command['command']}"
        elif any(word in message_lower for word in ['delete', 'remove']):
            return f"delete {last_command['command']}"
        
        # Default: combine with last command for context
        return f"{message} regarding {last_command['command']}"
