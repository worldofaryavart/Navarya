import os
import logging
from dotenv import load_dotenv
from typing import Dict, Any, List
from datetime import datetime

from openai import AsyncOpenAI
import json # Import json for parsing AI response

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

    def _prepare_context_from_documents(self, documents: List[Dict], user_message: str) -> str:
        """Prepare context from user documents based on relevance to the query"""
        if not documents:
            return ""
        
        # Simple keyword matching to find relevant documents
        user_message_lower = user_message.lower()
        relevant_docs = []
        
        for doc in documents:
            doc_text = doc.get('extracted_text', '')
            if doc_text:
                # Check if document might be relevant
                doc_name = doc.get('original_name', '').lower()
                
                # Simple relevance check - you can make this more sophisticated
                if (any(word in doc_text.lower() for word in user_message_lower.split() if len(word) > 3) or
                    any(word in doc_name for word in user_message_lower.split() if len(word) > 3)):
                        
                    # Truncate document text to avoid token limits
                    # DeepSeek has a context window, adjust based on actual model limits
                    truncated_text = doc_text[:4000] if len(doc_text) > 4000 else doc_text # Increased for potentially larger context
                    
                    relevant_docs.append({
                        'name': doc.get('original_name', 'Unknown'),
                        'content': truncated_text
                    })
        
        if not relevant_docs:
            return ""
        
        # Format context
        context = "Here are some relevant documents that might help answer your question:\n\n"
        for i, doc in enumerate(relevant_docs[:3], 1):  # Limit to 3 most relevant docs
            context += f"Document {i}: {doc['name']}\n"
            context += f"Content: {doc['content']}\n"
            context += "-" * 50 + "\n\n"
        
        return context

    def _create_system_prompt(self, has_documents: bool) -> str:
        """Create system prompt based on whether user has documents"""
        base_prompt = "You are a friendly and helpful assistant. Respond in a natural, conversational way like you're talking to a good friend. Be warm, engaging, and helpful."
        
        if has_documents:
            base_prompt += "\n\nThe user has uploaded some documents. When answering questions, you can reference information from these documents when relevant. If you use information from the documents, mention which document you're referencing. If the user asks about something not in the documents, let them know and provide general help if possible."
        
        return base_prompt

    async def process_message(self, message: str, user_id: str, user_documents: List[Dict] = None):
        """Process a command with DeepSeek AI model, including document context if available."""
        try:
            logger.info("Sending message to DeepSeek for command processing.")

            # Prepare document context
            if user_documents is None:
                user_documents = []
            
            document_context = self._prepare_context_from_documents(user_documents, message)
            
            # Create system prompt
            system_prompt = self._create_system_prompt(bool(user_documents))
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add document context if available
            if document_context:
                messages.append({
                    "role": "system", 
                    "content": f"Document Context:\n{document_context}"
                })
            
            # Add user message
            messages.append({"role": "user", "content": message})

            # Call DeepSeek API
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.7,
                max_tokens=1500  # Increased for document-based responses
            )

            result_text = response.choices[0].message.content.strip()
            logger.info(f"Response from DeepSeek: {result_text[:100]}...")

            return {
                'success': True,
                'message': result_text,
                'user_id': user_id,
                'used_documents': len(user_documents) > 0,
                'relevant_docs_count': len([doc for doc in user_documents if doc.get('extracted_text')])
            }

        except Exception as e:
            logger.error(f"Error in process_message: {e}")
            return {
                "success": False, 
                "message": f"Sorry, I ran into an issue: {str(e)}", 
                "user_id": user_id
            }

    async def generate_summary_and_key_points(self, document_text: str) -> Dict:
        """Generate a summary and key points from a given document text using DeepSeek AI."""
        try:
            logger.info("Generating summary and key points using DeepSeek.")

            # Truncate text if it's too long for the model's context window
            # DeepSeek-chat has a 128k context window, but for summary, we can use less.
            # Adjust as needed based on typical document sizes and model limits.
            if len(document_text) > 30000: # Example: limit to 30,000 characters for summary
                document_text = document_text[:30000] + "\n... [Document truncated for summary generation] ..."

            prompt = f"""Please read the following document text and provide a concise summary and a list of key points.
            
            Respond in JSON format with two keys: "summary" (string) and "keyPoints" (array of strings).

            Document Text:
            ---
            {document_text}
            ---

            JSON Response:
            """

            messages = [
                {"role": "system", "content": "You are an expert document summarizer. Your task is to provide accurate and concise summaries and key points from provided text."},
                {"role": "user", "content": prompt}
            ]

            response = await self.client.chat.completions.create(
                model="deepseek-chat", # Or deepseek-coder if preferred for structured output
                messages=messages,
                temperature=0.3, # Lower temperature for more factual, less creative output
                max_tokens=1000, # Sufficient tokens for summary and key points
                response_format={"type": "json_object"} # Request JSON output
            )

            result_content = response.choices[0].message.content.strip()
            logger.info(f"DeepSeek summary response: {result_content[:200]}...")

            # Parse the JSON response
            try:
                parsed_result = json.loads(result_content)
                summary = parsed_result.get("summary", "No summary generated.")
                key_points = parsed_result.get("keyPoints", [])
                if not isinstance(key_points, list): # Ensure keyPoints is a list
                    key_points = [str(key_points)] if key_points else []
                
                return {
                    'success': True,
                    'summary': summary,
                    'key_points': key_points
                }
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON response from DeepSeek: {result_content}")
                return {
                    'success': False,
                    'message': "AI response was not in expected JSON format.",
                    'summary': "Could not generate summary.",
                    'key_points': []
                }

        except Exception as e:
            logger.error(f"Error generating summary and key points: {e}")
            return {
                "success": False, 
                "message": f"Failed to generate summary: {str(e)}", 
                "summary": "Could not generate summary due to an error.",
                "key_points": []
            }

    async def search_in_documents(self, query: str, user_id: str, user_documents: List[Dict] = None) -> Dict:
        """Search for specific content in user's documents"""
        try:
            if not user_documents:
                return {
                    'success': False,
                    'message': "No documents found to search in.",
                    'user_id': user_id
                }
            
            # Search through documents
            search_results = []
            query_lower = query.lower()
            
            for doc in user_documents:
                doc_text = doc.get('extracted_text', '')
                if doc_text and query_lower in doc_text.lower():
                    # Find context around the match
                    doc_text_lower = doc_text.lower()
                    match_index = doc_text_lower.find(query_lower)
                    
                    # Get context (100 chars before and after)
                    start = max(0, match_index - 100)
                    end = min(len(doc_text), match_index + len(query) + 100)
                    context = doc_text[start:end]
                    
                    search_results.append({
                        'document': doc.get('original_name', 'Unknown'),
                        'context': context,
                        'match_position': match_index
                    })
            
            if search_results:
                result_message = f"Found '{query}' in {len(search_results)} document(s):\n\n"
                for i, result in enumerate(search_results[:5], 1):  # Limit to 5 results
                    result_message += f"{i}. In '{result['document']}':\n"
                    result_message += f"...{result['context']}...\n\n"
                
                return {
                    'success': True,
                    'message': result_message,
                    'user_id': user_id,
                    'search_results': search_results
                }
            else:
                return {
                    'success': True,
                    'message': f"No matches found for '{query}' in your uploaded documents.",
                    'user_id': user_id
                }
            
        except Exception as e:
            logger.error(f"Error in search_in_documents: {e}")
            return {
                "success": False,
                "message": f"Error searching documents: {str(e)}",
                "user_id": user_id
            }
