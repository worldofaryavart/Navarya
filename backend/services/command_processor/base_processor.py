from typing import Dict, Any, Optional
from datetime import datetime
import json

class BaseCommandProcessor:
    def __init__(self, db):
        self.db = db
        self.SYSTEM_PROMPT = ""

    def get_system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def process_message(self, message: str, session_context: Dict = None, persistent_context: Dict = None, current_time: str = None) -> Dict[Any, Any]:
        """Process a message with context awareness"""
        try:
            # Initialize context if not provided
            session_context = session_context or {}
            persistent_context = persistent_context or {}

            # Store the current message in context
            session_context['current_message'] = message
            session_context['timestamp'] = current_time or datetime.utcnow().isoformat()

            # Process the message based on type
            if self._is_create_command(message):
                result = await self._handle_create(message, session_context)
            elif self._is_update_command(message):
                result = await self._handle_update(message, session_context)
            elif self._is_delete_command(message):
                result = await self._handle_delete(message, session_context)
            elif self._is_list_command(message):
                result = await self._handle_list(message, session_context)
            else:
                result = await self._handle_unknown(message, session_context)

            # Update context with the result
            if result.get('success'):
                session_context['lastSuccessfulCommand'] = {
                    'command': message,
                    'result': result,
                    'timestamp': session_context['timestamp']
                }

            return result
        except Exception as e:
            print(f"Error in base processor: {str(e)}")
            return {
                'success': False,
                'message': f"Error processing command: {str(e)}"
            }

    def _is_create_command(self, message: str) -> bool:
        """Check if message is a create command"""
        create_keywords = ['create', 'add', 'make', 'new']
        return any(keyword in message.lower() for keyword in create_keywords)

    def _is_update_command(self, message: str) -> bool:
        """Check if message is an update command"""
        update_keywords = ['update', 'change', 'modify', 'edit', 'set']
        return any(keyword in message.lower() for keyword in update_keywords)

    def _is_delete_command(self, message: str) -> bool:
        """Check if message is a delete command"""
        delete_keywords = ['delete', 'remove', 'clear']
        return any(keyword in message.lower() for keyword in delete_keywords)

    def _is_list_command(self, message: str) -> bool:
        """Check if message is a list command"""
        list_keywords = ['list', 'show', 'display', 'get']
        return any(keyword in message.lower() for keyword in list_keywords)

    async def _handle_create(self, message: str, context: Dict) -> Dict[str, Any]:
        """Handle create command"""
        raise NotImplementedError

    async def _handle_update(self, message: str, context: Dict) -> Dict[str, Any]:
        """Handle update command"""
        raise NotImplementedError

    async def _handle_delete(self, message: str, context: Dict) -> Dict[str, Any]:
        """Handle delete command"""
        raise NotImplementedError

    async def _handle_list(self, message: str, context: Dict) -> Dict[str, Any]:
        """Handle list command"""
        raise NotImplementedError

    async def _handle_unknown(self, message: str, context: Dict) -> Dict[str, Any]:
        """Handle unknown command"""
        return {
            'success': False,
            'message': "I don't understand this command. Please try rephrasing it."
        }
