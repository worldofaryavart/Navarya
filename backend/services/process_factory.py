import os
import logging
from dotenv import load_dotenv
from typing import Dict, Any, List
from datetime import datetime
import difflib
from fuzzywuzzy import fuzz
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

    def _prepare_enhanced_context(self, documents: List[Dict], user_message: str, conversation_history: List[Dict] = None) -> Dict:
        """Enhanced context preparation with conversation history"""
        
        # Simple keyword-based relevance (you can enhance with embeddings later)
        relevant_chunks = []
        user_message_lower = user_message.lower()
        
        for doc in documents:
            if 'chunks' in doc:
                for chunk in doc['chunks']:
                    chunk_text = chunk['text'].lower()
                    # Simple relevance scoring
                    relevance_score = sum(1 for word in user_message_lower.split() 
                                        if len(word) > 3 and word in chunk_text)
                    
                    if relevance_score > 0:
                        relevant_chunks.append({
                            **chunk,
                            'relevance_score': relevance_score,
                            'original_doc': doc['original_name']
                        })
        
        # Sort by relevance and take top chunks
        relevant_chunks.sort(key=lambda x: x['relevance_score'], reverse=True)
        top_chunks = relevant_chunks[:5]  # Top 5 most relevant chunks
        
        # Format context with metadata
        context = ""
        chunk_references = []
        
        for i, chunk in enumerate(top_chunks):
            context += f"\n[Reference {i+1}] From document '{chunk['original_doc']}', {chunk['section']}:\n"
            context += f"{chunk['text']}\n"
            context += "-" * 50 + "\n"
            
            chunk_references.append({
                'document': chunk['original_doc'],
                'section': chunk['section'],
                'paragraph_index': chunk['paragraph_index'],
                'relevance_score': chunk['relevance_score']
            })
        
        return {
            'context': context,
            'references': chunk_references,
            'total_relevant_chunks': len(relevant_chunks)
        }
    
    def _create_enhanced_system_prompt(self, has_documents: bool, conversation_history: List[Dict] = None) -> str:
        """Enhanced system prompt for document Q&A"""
        
        base_prompt = """You are an intelligent document assistant. Your job is to:
        1. Answer questions based on the provided document content
        2. Always cite your sources using the reference numbers provided [Reference X]
        3. Explain your reasoning clearly
        4. If information spans multiple sections, mention all relevant sources
        5. If you cannot find the answer in the documents, clearly state this
        
        When citing sources, use this format: "According to [Reference 1] from document 'filename.pdf', Section Y..."
        
        Be conversational but precise. Always justify your answers with specific references."""
        
        if conversation_history:
            base_prompt += "\n\nYou have access to our previous conversation for context, but always prioritize the document content for factual answers."
        
        return base_prompt


    async def process_message(self, message: str, user_id: str, user_documents: List[Dict] = None, conversation_history: List[Dict] = None):
        """Enhanced message processing with context and citations"""
        try:
            logger.info("Processing enhanced message with document context")
            
            if user_documents is None:
                user_documents = []
            
            # Prepare enhanced context
            context_data = self._prepare_enhanced_context(user_documents, message, conversation_history)
            print("\n\n\n")
            print(f"Context data prepared: {context_data}")  # Log first 200 chars of context

            
            # Build conversation with history
            messages = [
                {"role": "system", "content": self._create_enhanced_system_prompt(bool(user_documents), conversation_history)}
            ]
            
            # Add conversation history (last 4 messages for context)
            if conversation_history:
                recent_history = conversation_history[-4:]  # Last 4 messages
                for hist_msg in recent_history:
                    messages.append({
                        "role": hist_msg.get("role", "user"),
                        "content": hist_msg.get("content", "")
                    })
            
            # Add document context
            if context_data['context']:
                messages.append({
                    "role": "system",
                    "content": f"Document Context:\n{context_data['context']}"
                })
            
            # Add current user message
            messages.append({"role": "user", "content": message})
            
            # Enhanced prompt for better citations
            enhanced_message = f"""Question: {message}

    Please answer this question using the provided document context. 
    Make sure to:
    1. Cite specific references using [Reference X] format
    2. Explain your reasoning
    3. If the answer isn't in the documents, say so clearly

    Answer:"""
            
            messages[-1]["content"] = enhanced_message
            
            # Call DeepSeek
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.3,  # Lower for more factual responses
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            
             # Extract supporting snippets
            context_chunks = []
            if context_data['references']:
                for ref in context_data['references']:
                    # Find the original chunk data
                    for doc in user_documents:
                        if 'chunks' in doc:
                            for chunk in doc['chunks']:
                                if (chunk['paragraph_index'] == ref['paragraph_index'] and 
                                    chunk['document'] == ref['document']):
                                    context_chunks.append(chunk)
                                    break
            
            supporting_snippets = self.extract_supporting_snippets(result_text, context_chunks)
            
            return {
                'success': True,
                'message': result_text,
                'user_id': user_id,
                'sources': context_data['references'],
                'supporting_snippets': supporting_snippets,  # New field
                'used_documents': len(user_documents) > 0,
                'total_references': len(context_data['references']),
                'confidence': self._calculate_confidence(context_data)
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced process_message: {e}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}",
                "user_id": user_id
            }

    def _calculate_confidence(self, context_data: Dict) -> float:
        """Simple confidence calculation based on relevance"""
        if not context_data['references']:
            return 0.0
        
        avg_relevance = sum(ref['relevance_score'] for ref in context_data['references']) / len(context_data['references'])
        return min(avg_relevance / 10.0, 1.0)  # Normalize to 0-1

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

    async def generate_questions_from_document(self, document_data: Dict, difficulty: str = "medium", num_questions: int = 3) -> Dict:
        """Generate comprehension questions from document content"""
        try:
            logger.info(f"Generating {num_questions} questions from document")
            
            # Get document chunks
            chunks = document_data.get('chunks', [])
            if not chunks:
                return {
                    'success': False,
                    'message': "No content available to generate questions from"
                }
            
            # Select diverse chunks for questions (avoid consecutive paragraphs)
            selected_chunks = []
            chunk_indices = list(range(len(chunks)))
            
            # Select chunks with good spacing
            for i in range(0, len(chunks), max(1, len(chunks) // (num_questions * 2))):
                if len(selected_chunks) < num_questions and i < len(chunks):
                    chunk = chunks[i]
                    if len(chunk['text']) > 100:  # Ensure chunk has enough content
                        selected_chunks.append(chunk)
            
            # If we don't have enough chunks, fill with remaining good chunks
            while len(selected_chunks) < num_questions and len(selected_chunks) < len(chunks):
                for chunk in chunks:
                    if chunk not in selected_chunks and len(chunk['text']) > 100:
                        selected_chunks.append(chunk)
                        if len(selected_chunks) >= num_questions:
                            break
            
            # Generate questions for each selected chunk
            questions = []
            
            for i, chunk in enumerate(selected_chunks[:num_questions]):
                prompt = f"""Based on the following text snippet, generate ONE {difficulty} difficulty comprehension question.

    Text: "{chunk['text']}"

    Generate a question that tests understanding of the key concepts in this text. 

    Respond in JSON format:
    {{
        "question": "Your question here",
        "expected_answer": "The key points that should be in a good answer",
        "difficulty": "{difficulty}",
        "question_type": "comprehension|analysis|application"
    }}

    The question should be specific enough that someone who read and understood this text could answer it, but not so obvious that it's just asking for a direct quote."""

                messages = [
                    {"role": "system", "content": "You are an expert educator who creates thoughtful comprehension questions. Generate questions that test true understanding, not just memorization."},
                    {"role": "user", "content": prompt}
                ]
                
                response = await self.client.chat.completions.create(
                    model="deepseek-chat",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=300,
                    response_format={"type": "json_object"}
                )
                
                try:
                    question_data = json.loads(response.choices[0].message.content.strip())
                    
                    question_id = f"q_{i+1}_{datetime.now().timestamp()}"
                    questions.append({
                        'id': question_id,
                        'question': question_data.get('question', ''),
                        'expected_answer': question_data.get('expected_answer', ''),
                        'difficulty': difficulty,
                        'question_type': question_data.get('question_type', 'comprehension'),
                        'source_chunk': {
                            'text': chunk['text'],
                            'section': chunk['section'],
                            'paragraph_index': chunk['paragraph_index'],
                            'document': chunk['document']
                        },
                        'reference_section': chunk['section']
                    })
                    
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse question JSON for chunk {i}")
                    continue
            
            return {
                'success': True,
                'questions': questions,
                'total_generated': len(questions),
                'document_name': document_data.get('original_name', 'Unknown')
            }
            
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return {
                'success': False,
                'message': f"Failed to generate questions: {str(e)}"
            }

    async def evaluate_answer(self, question_data: Dict, user_answer: str, document_data: Dict) -> Dict:
        """Evaluate user's answer against expected answer"""
        try:
            logger.info("Evaluating user answer")
            
            source_chunk = question_data.get('source_chunk', {})
            expected_answer = question_data.get('expected_answer', '')
            original_question = question_data.get('question', '')
            
            prompt = f"""Evaluate this student's answer to a comprehension question.

    Original Question: "{original_question}"

    Source Text: "{source_chunk.get('text', '')}"

    Expected Answer Key Points: "{expected_answer}"

    Student's Answer: "{user_answer}"

    Evaluate the student's answer and provide feedback. Consider:
    1. Does the answer demonstrate understanding of the key concepts?
    2. Is it factually correct based on the source text?
    3. What important points are missing?
    4. What did they do well?

    Respond in JSON format:
    {{
        "score": 85,
        "is_correct": true,
        "feedback": "Detailed feedback explaining what was good and what could be improved",
        "missing_points": ["Point 1 they missed", "Point 2 they missed"],
        "strengths": ["What they did well"],
        "reference_text": "Exact quote from source that supports the correct answer"
    }}

    Score should be 0-100. Consider an answer "correct" (is_correct: true) if score >= 70."""

            messages = [
                {"role": "system", "content": "You are a fair and encouraging teacher who provides constructive feedback. Be specific about what the student did well and what they can improve."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            evaluation = json.loads(response.choices[0].message.content.strip())
            
            return {
                'success': True,
                'evaluation': evaluation,
                'question_id': question_data.get('id'),
                'source_reference': {
                    'section': source_chunk.get('section'),
                    'document': source_chunk.get('document'),
                    'text_snippet': source_chunk.get('text')[:200] + "..."
                }
            }
            
        except Exception as e:
            logger.error(f"Error evaluating answer: {e}")
            return {
                'success': False,
                'message': f"Failed to evaluate answer: {str(e)}"
            }
        
    def extract_supporting_snippets(self, ai_response: str, context_chunks: List[Dict], max_snippets: int = 3) -> List[Dict]:
        """Extract exact supporting text snippets from the document"""
        try:
            supporting_snippets = []
            
            # Extract potential quotes or references from AI response
            # Look for phrases that might be paraphrased from the document
            response_sentences = ai_response.split('. ')
            
            for chunk in context_chunks:
                chunk_text = chunk['text']
                best_match_score = 0
                best_match_snippet = ""
                best_sentence = ""
                
                # Check each sentence in the response against this chunk
                for sentence in response_sentences:
                    if len(sentence.strip()) < 20:  # Skip very short sentences
                        continue
                    
                    # Use fuzzy matching to find similar content
                    similarity = fuzz.partial_ratio(sentence.lower(), chunk_text.lower())
                    
                    if similarity > best_match_score and similarity > 60:  # Threshold for relevance
                        best_match_score = similarity
                        best_sentence = sentence.strip()
                        
                        # Find the most relevant snippet from the chunk
                        words = sentence.lower().split()
                        for i in range(len(chunk_text) - 100):
                            snippet = chunk_text[i:i+200]
                            snippet_similarity = fuzz.partial_ratio(' '.join(words[:5]), snippet.lower())
                            if snippet_similarity > 70:
                                best_match_snippet = snippet
                                break
                
                if best_match_score > 60:
                    supporting_snippets.append({
                        'snippet': best_match_snippet or chunk_text[:200] + "...",
                        'full_text': chunk_text,
                        'section': chunk['section'],
                        'paragraph_index': chunk['paragraph_index'],
                        'document': chunk['document'],
                        'confidence': best_match_score / 100.0,
                        'ai_sentence': best_sentence,
                        'char_start': chunk.get('char_start', 0),
                        'char_end': chunk.get('char_end', len(chunk_text))
                    })
            
            # Sort by confidence and return top matches
            supporting_snippets.sort(key=lambda x: x['confidence'], reverse=True)
            return supporting_snippets[:max_snippets]
            
        except Exception as e:
            logger.error(f"Error extracting supporting snippets: {e}")
            return []