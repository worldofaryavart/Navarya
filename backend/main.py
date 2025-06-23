from fastapi import FastAPI, HTTPException, Depends, Request, Response, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime
from enum import Enum
from services.process_factory import ProcessFactory

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
        raise HTTPException(status_code=401, detail=str(e))


async def get_token(authorization: str = Header(...)):
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise UnauthorizedError("Invalid token format")
        token = authorization.split(' ')[1]
        return token
    except Exception as e:
        raise UnauthorizedError(f"Token error: {str(e)}")

class Role(str, Enum):
    USER = 'user'
    AI = 'assistant'

class MessageRequest(BaseModel):
    role: Role
    content: str

@app.post("/api/process-command")
async def process_command(message: MessageRequest, user = Depends(verify_token)):
    """Process natural language commands using AI"""
    try:
        user_id = user['uid']
        print("user id is:  ", user_id)

        
        # Process command
        processor_factory = ProcessFactory(db)
        result = await processor_factory.process_message(message.content, user_id)

        print("result in process _command: ", result)
        if not result:
            raise HTTPException(status_code=400, detail="No valid command found")
        
        return result
    except Exception as e:
        print(f"Error in process_command: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)