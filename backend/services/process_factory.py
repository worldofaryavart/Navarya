import os
import logging
from dotenv import load_dotenv
from typing import Dict, Any, List
from datetime import datetime

from openai import AsyncOpenAI

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class ProcessFactory:
    """Factory class to create process instances based on the type of process."""

    def __init__(self, db):
        """Initialize with database instance (matching ProcessorFactory pattern)"""
        self.db = db
        self.DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
        if not self.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")
        
        self.client = AsyncOpenAI(
            api_key=self.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com"
        )

    async def process_message(self, message: str, user_id: str):
        """Process a command with DeepSeek AI model."""
        try:
            logger.info("Sending message to DeepSeek")

            # Call DeepSeek API
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a friendly and helpful assistant. Respond in a natural, conversational way like you're talking to a good friend. Be warm, engaging, and helpful."
                    },
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            result_text = response.choices[0].message.content.strip()
            logger.info(f"Response from DeepSeek: {result_text[:100]}...")

            return {
                'success': True,
                'message': result_text,
                'user_id': user_id
            }

        except Exception as e:
            logger.error(f"Error in process_message: {e}")
            return {
                "success": False, 
                "message": f"Sorry, I ran into an issue: {str(e)}", 
                "user_id": user_id
            }