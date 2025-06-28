from fastapi import FastAPI, HTTPException, Depends, Request, Response, Header, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime
from enum import Enum
from services.process_factory import ProcessFactory
import shutil
import PyPDF2
import io
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory to serve static files
# Files will be accessible at /static/filename.pdf
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# Dependency to verify Firebase token
async def verify_token(request: Request):
    """Verify Firebase ID token from Authorization header"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="No valid authorization header")
        
        token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(token)
        
        return {'uid': decoded_token['uid'], 'token': token}
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail=str(e))

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            # Ensure page.extract_text() returns a string or handle None
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def save_user_documents(user_id: str, documents: List[Dict]) -> None:
    """Save user documents to Firestore"""
    try:
        user_doc_ref = db.collection('user_documents').document(user_id)
        
        # Get existing documents
        existing_doc = user_doc_ref.get()
        if existing_doc.exists:
            existing_docs = existing_doc.to_dict().get('documents', [])
        else:
            existing_docs = []
        
        # Add new documents
        existing_docs.extend(documents)
        
        # Save back to Firestore
        user_doc_ref.set({
            'documents': existing_docs,
            'updated_at': datetime.now()
        })
        logger.info(f"Documents saved for user {user_id}")
    except Exception as e:
        logger.error(f"Error saving documents to Firestore for user {user_id}: {e}")

def get_user_documents(user_id: str) -> List[Dict]:
    """Get user documents from Firestore"""
    try:
        user_doc_ref = db.collection('user_documents').document(user_id)
        doc = user_doc_ref.get()
        
        if doc.exists:
            return doc.to_dict().get('documents', [])
        return []
    except Exception as e:
        logger.error(f"Error getting documents from Firestore for user {user_id}: {e}")
        return []

class Role(str, Enum):
    USER = 'user'
    AI = 'assistant'

class MessageRequest(BaseModel):
    role: Role
    content: str

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...), user = Depends(verify_token)):
    """Upload and process files"""
    try:
        user_id = user['uid']
        uploaded_files_info = [] # Store info to return to frontend
        documents_to_save = []
        
        for file in files:
            logger.info(f"Processing uploaded file: {file.filename} ({file.content_type})")
            # Check file type
            if not file.content_type:
                logger.warning(f"Skipping file {file.filename} due to missing content type.")
                continue
                
            # Read file content
            file_content = await file.read()
            
            # Create unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{user_id}_{datetime.now().timestamp()}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # Save file to disk
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            logger.info(f"File saved to: {file_path}")
            
            # Process based on file type
            extracted_text = ""
            if file.content_type == "application/pdf":
                extracted_text = extract_text_from_pdf(file_content)
            elif file.content_type.startswith("text/"):
                extracted_text = file_content.decode('utf-8')
            
            # Prepare document data for Firestore
            document_data = {
                "id": unique_filename, # This is the ID frontend will use
                "original_name": file.filename,
                "file_type": file.content_type,
                "file_size": len(file_content),
                "file_path": file_path, # Store full path for backend access
                "extracted_text": extracted_text,
                "uploaded_at": datetime.now().isoformat()
            }
            
            documents_to_save.append(document_data)
            
            # Prepare info to send back to frontend
            uploaded_files_info.append({
                "name": file.filename,
                "size": len(file_content),
                "type": file.content_type,
                "id": unique_filename, # Frontend needs this ID to request summary/view PDF
                "url": f"/static/{unique_filename}" # URL to access the file
            })
        
        # Save documents metadata to Firestore
        if documents_to_save:
            save_user_documents(user_id, documents_to_save)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Files uploaded successfully",
                "files": uploaded_files_info,
                "total_files": len(uploaded_files_info)
            }
        )
        
    except Exception as e:
        logger.error(f"Error in upload_files endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@app.get("/api/summarize-document/{document_id}")
async def summarize_document(document_id: str, user = Depends(verify_token)):
    """Generate AI summary and key points for a specific document."""
    try:
        user_id = user['uid']
        user_documents = get_user_documents(user_id)
        
        target_document = next((doc for doc in user_documents if doc.get('id') == document_id), None)
        
        if not target_document:
            raise HTTPException(status_code=404, detail="Document not found for this user.")
        
        extracted_text = target_document.get('extracted_text')
        if not extracted_text:
            raise HTTPException(status_code=400, detail="No extractable text found for this document.")
        
        processor_factory = ProcessFactory(db)
        summary_result = await processor_factory.generate_summary_and_key_points(extracted_text)
        
        if summary_result['success']:
            # Update the document in Firestore with summary and key points
            # This is optional but good for persistence
            updated_documents = []
            for doc in user_documents:
                if doc.get('id') == document_id:
                    doc['summary'] = summary_result.get('summary', '')
                    doc['key_points'] = summary_result.get('key_points', [])
                updated_documents.append(doc)
            
            user_doc_ref = db.collection('user_documents').document(user_id)
            user_doc_ref.set({'documents': updated_documents, 'updated_at': datetime.now()})

            return JSONResponse(
                status_code=200,
                content={
                    "summary": summary_result.get('summary'),
                    "keyPoints": summary_result.get('key_points')
                }
            )
        else:
            raise HTTPException(status_code=500, detail=summary_result.get('message', "Failed to generate summary."))
            
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in summarize_document endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/api/process-command")
async def process_command(message: MessageRequest, user = Depends(verify_token)):
    """Process natural language commands using AI"""
    try:
        user_id = user['uid']
        logger.info(f"Processing command for user: {user_id}")

        # Get user documents for context
        user_documents = get_user_documents(user_id)
        
        # Process command
        processor_factory = ProcessFactory(db)
        result = await processor_factory.process_message(message.content, user_id, user_documents)

        logger.info(f"Result from process_command: {result.get('message', '')[:100]}...")
        if not result:
            raise HTTPException(status_code=400, detail="No valid command found")
        
        return result
    except Exception as e:
        logger.error(f"Error in process_command endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def get_documents(user = Depends(verify_token)):
    """Get user's uploaded documents"""
    try:
        user_id = user['uid']
        documents = get_user_documents(user_id)
        
        # Return only metadata (without full text content)
        doc_metadata = []
        for doc in documents:
            doc_metadata.append({
                "id": doc.get("id"),
                "original_name": doc.get("original_name"),
                "file_type": doc.get("file_type"),
                "file_size": doc.get("file_size"),
                "uploaded_at": doc.get("uploaded_at"),
                "has_text": bool(doc.get("extracted_text")),
                "summary": doc.get("summary", ""), # Include summary if present
                "keyPoints": doc.get("key_points", []), # Include key points if present
                "url": f"/static/{doc.get('id')}" # Provide URL for viewing
            })
        
        return JSONResponse(
            status_code=200,
            content={
                "documents": doc_metadata,
                "total": len(doc_metadata)
            }
        )
    except Exception as e:
        logger.error(f"Error in get_documents endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# Add this new endpoint to your FastAPI code

@app.get("/api/documents/{document_id}")
async def get_document_details(document_id: str, user = Depends(verify_token)):
    """Get details of a specific user document by its ID."""
    try:
        user_id = user['uid']
        user_documents = get_user_documents(user_id)

        target_document = next((doc for doc in user_documents if doc.get('id') == document_id), None)

        if not target_document:
            raise HTTPException(status_code=404, detail="Document not found for this user or ID.")
        
        # Prepare the response, similar to how you structure pdfData on the frontend
        response_data = {
            "name": target_document.get("original_name"),
            "size": target_document.get("file_size"),
            "type": target_document.get("file_type"),
            "fileId": target_document.get("id"),
            "pdfUrl": f"/static/{target_document.get('id')}", # Construct the static URL
            "summary": target_document.get("summary", None), # Can be null if not yet summarized
            "keyPoints": target_document.get("key_points", []),
            # Add other relevant fields if needed, e.g., isLoadingSummary or summaryError from backend is less common
            # Frontend will manage isLoadingSummary based on whether summary is present.
            "summaryError": target_document.get("summary_error", None) # If you store summary errors
        }

        return JSONResponse(
            status_code=200,
            content=response_data
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in get_document_details endpoint for document_id {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving document details: {str(e)}")

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, user = Depends(verify_token)):
    """Delete a user's document"""
    try:
        user_id = user['uid']
        
        # Get user documents
        user_doc_ref = db.collection('user_documents').document(user_id)
        doc = user_doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="No documents found")
        
        documents = doc.to_dict().get('documents', [])
        
        # Find and remove the document
        document_to_delete = None
        updated_documents = []
        
        for document in documents:
            if document.get('id') == document_id:
                document_to_delete = document
            else:
                updated_documents.append(document)
        
        if not document_to_delete:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete file from disk
        file_path = document_to_delete.get('file_path')
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file from disk: {file_path}")
        
        # Update Firestore
        user_doc_ref.set({
            'documents': updated_documents,
            'updated_at': datetime.now()
        })
        logger.info(f"Document {document_id} deleted from Firestore for user {user_id}")
        
        return JSONResponse(
            status_code=200,
            content={"message": "Document deleted successfully"}
        )
        
    except Exception as e:
        logger.error(f"Error in delete_document endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
