import json
import os
from typing import Dict, List, Optional
from datetime import datetime
import dateparser
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import CTransformers
from pydantic import BaseModel

class TaskField(BaseModel):
    name: str
    type: str
    description: str
    required: bool
    examples: Optional[List[str]]
    enum: Optional[List[str]]
    default: Optional[str]

class RAGService:
    def __init__(self, model_path: str = "llama-2-13b-chat.ggmlv3.q4_0.bin"):
        # Initialize the embedding model
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
        # Initialize the LLM
        self.llm = CTransformers(
            model=model_path,
            model_type="llama",
            config={
                'max_new_tokens': 512,
                'temperature': 0.7,
                'context_length': 2048,
            }
        )
        
        # Initialize vector store
        self._init_vector_store()
        
        # Initialize prompt templates
        self.task_generation_template = PromptTemplate(
            input_variables=["schema_info", "user_input"],
            template="""<s>[INST] Based on the following schema and user input, generate a structured task entry.

Schema Information:
{schema_info}

User Input: {user_input}

Generate a JSON object with all required fields and any optional fields that can be inferred from the input.
Make sure to:
1. Extract date and time information correctly
2. Infer priority based on language and context
3. Generate a clear title and description
4. Add relevant tags if mentioned

Output the result in valid JSON format. [/INST]</s>"""
        )
        
        # Initialize chain
        self.task_chain = LLMChain(
            llm=self.llm,
            prompt=self.task_generation_template,
            verbose=True
        )

    def _init_vector_store(self):
        """Initialize the vector store with schema information"""
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                 'schemas', 'task_schema.json')
        
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Convert schema fields to documents
        documents = []
        for field in schema['task_fields']:
            field_str = (f"Field: {field['name']}\n"
                        f"Type: {field['type']}\n"
                        f"Description: {field['description']}\n"
                        f"Required: {field['required']}\n")
            
            if 'examples' in field:
                field_str += f"Examples: {', '.join(field['examples'])}\n"
            if 'enum' in field:
                field_str += f"Allowed values: {', '.join(field['enum'])}\n"
            if 'default' in field:
                field_str += f"Default: {field['default']}\n"
                
            documents.append(field_str)
        
        # Create text splitter
        text_splitter = CharacterTextSplitter(
            separator="\n\n",
            chunk_size=1000,
            chunk_overlap=200
        )
        
        # Split documents
        texts = text_splitter.create_documents(documents)
        
        # Create vector store
        self.vector_store = Chroma.from_documents(
            documents=texts,
            embedding=self.embeddings,
            persist_directory="./chroma_db"
        )

    async def process_task_command(self, user_input: str) -> Dict:
        """Process a task command using RAG"""
        try:
            # Retrieve relevant schema information
            docs = self.vector_store.similarity_search(user_input, k=3)
            schema_info = "\n".join([doc.page_content for doc in docs])
            
            # Generate structured task
            result = self.task_chain.run(
                schema_info=schema_info,
                user_input=user_input
            )
            
            # Parse the generated JSON
            task_data = json.loads(result)
            
            # Parse and validate dates
            if 'due_date' in task_data:
                parsed_date = dateparser.parse(task_data['due_date'])
                if parsed_date:
                    task_data['due_date'] = parsed_date.isoformat()
            
            if 'reminder' in task_data and 'time' in task_data['reminder']:
                parsed_reminder = dateparser.parse(task_data['reminder']['time'])
                if parsed_reminder:
                    task_data['reminder']['time'] = parsed_reminder.isoformat()
            
            return {
                "success": True,
                "task_data": task_data,
                "schema_used": schema_info,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def validate_task_data(self, task_data: Dict) -> Dict:
        """Validate task data against the schema"""
        try:
            schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                     'schemas', 'task_schema.json')
            
            with open(schema_path, 'r') as f:
                schema = json.load(f)
            
            errors = []
            
            # Check required fields
            for field in schema['task_fields']:
                if field['required'] and field['name'] not in task_data:
                    errors.append(f"Missing required field: {field['name']}")
                elif field['name'] in task_data:
                    # Validate enum values
                    if 'enum' in field and task_data[field['name']] not in field['enum']:
                        errors.append(f"Invalid value for {field['name']}: {task_data[field['name']]}")
            
            if errors:
                return {
                    "success": False,
                    "errors": errors,
                    "timestamp": datetime.now().isoformat()
                }
            
            return {
                "success": True,
                "task_data": task_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
