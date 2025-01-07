from typing import Dict, Any, Optional
from services.command_processor.base_processor import BaseCommandProcessor
from services.command_processor.task_processor import TaskProcessor

class ProcessorFactory:
    def __init__(self, db):
        self.db = db
        self._processors: Dict[str, BaseCommandProcessor] = {
            'tasks': TaskProcessor(db),
            # Add more processors as they are implemented:
            # 'email': EmailProcessor(db),
            # 'browser': BrowserProcessor(db),
            # 'social': SocialMediaProcessor(db),
            # 'system': SystemProcessor(db),
        }

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

            # Check for follow-up questions using session context
            if session_context.get('lastSuccessfulCommand'):
                last_command = session_context['lastSuccessfulCommand']
                # If this is a follow-up question (e.g., "Change it", "Delete that")
                if self._is_followup_question(message):
                    message = self._resolve_followup_reference(message, last_command)

            # Process message with context
            result = await processor.process_message(
                message,
                session_context=session_context,
                persistent_context=persistent_context,
                current_time=current_time
            )

            return result
        except Exception as e:
            print(f"Error processing message with context: {str(e)}")
            return {
                'success': False,
                'message': 'Error processing your request. Please try again.',
                'error': str(e)
            }

    def _is_followup_question(self, message: str) -> bool:
        """Check if the message is a follow-up question"""
        followup_indicators = [
            'it', 'that', 'this', 'the task', 'the reminder',
            'change', 'modify', 'update', 'delete', 'remove',
            'show', 'what', 'when', 'where', 'who', 'how'
        ]
        message_lower = message.lower()
        return any(indicator in message_lower for indicator in followup_indicators)

    def _resolve_followup_reference(self, message: str, last_command: Dict[str, Any]) -> str:
        """Resolve references in follow-up questions using context"""
        message_lower = message.lower()

        # Handle different types of follow-ups
        if any(word in message_lower for word in ['change', 'modify', 'update']):
            return f"update {last_command['command']}"
        elif any(word in message_lower for word in ['delete', 'remove']):
            return f"delete {last_command['command']}"
        elif 'show' in message_lower or message_lower.startswith(('what', 'when', 'where', 'who', 'how')):
            return f"show details of {last_command['command']}"
        
        # Default: combine with last command for context
        return f"{message} regarding {last_command['command']}"
