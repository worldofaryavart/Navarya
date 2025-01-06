from typing import Dict, Any
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
        """Get the default processor (task processor for now)"""
        return self._processors['tasks']

    def register_processor(self, domain: str, processor: BaseCommandProcessor):
        """Register a new processor for a domain"""
        self._processors[domain] = processor
