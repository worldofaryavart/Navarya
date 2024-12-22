from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os.path
import pickle
from typing import List, Dict, Any, Optional
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, credentials

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin
cred = credentials.Certificate('path/to/your/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

class MailProcessor:
    def __init__(self):
        self.creds = None
        self.service = None

    def authenticate(self):
        """Authenticate with Gmail API."""
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                self.creds = pickle.load(token)
        
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                self.creds = flow.run_local_server(port=0)
            
            with open('token.pickle', 'wb') as token:
                pickle.dump(self.creds, token)

        self.service = build('gmail', 'v1', credentials=self.creds)

    async def get_emails(self, query: str = '') -> List[Dict[str, Any]]:
        """Get emails matching the query."""
        try:
            results = self.service.users().messages().list(
                userId='me', q=query).execute()
            messages = results.get('messages', [])

            emails = []
            for message in messages:
                msg = self.service.users().messages().get(
                    userId='me', id=message['id']).execute()
                
                headers = msg['payload']['headers']
                subject = next(h['value'] for h in headers if h['name'] == 'Subject')
                from_email = next(h['value'] for h in headers if h['name'] == 'From')
                to_email = next(h['value'] for h in headers if h['name'] == 'To')
                date = next(h['value'] for h in headers if h['name'] == 'Date')

                # Get email body
                if 'parts' in msg['payload']:
                    body = self._get_body_from_parts(msg['payload']['parts'])
                else:
                    body = base64.urlsafe_b64decode(
                        msg['payload']['body']['data']
                    ).decode('utf-8')

                email = {
                    'id': message['id'],
                    'threadId': msg['threadId'],
                    'subject': subject,
                    'from': from_email,
                    'to': [to.strip() for to in to_email.split(',')],
                    'body': body,
                    'timestamp': date,
                    'read': 'UNREAD' not in msg['labelIds'],
                    'important': 'IMPORTANT' in msg['labelIds'],
                    'labels': msg['labelIds']
                }
                emails.append(email)

            return emails
        except Exception as e:
            print(f"Error getting emails: {e}")
            return []

    def _get_body_from_parts(self, parts: List[Dict[str, Any]]) -> str:
        """Extract email body from message parts."""
        body = ''
        for part in parts:
            if part['mimeType'] == 'text/plain':
                body = base64.urlsafe_b64decode(
                    part['body']['data']
                ).decode('utf-8')
                break
            elif 'parts' in part:
                body = self._get_body_from_parts(part['parts'])
                if body:
                    break
        return body

    async def send_email(self, to: List[str], subject: str, body: str) -> Dict[str, Any]:
        """Send an email."""
        try:
            message = MIMEMultipart()
            message['to'] = ', '.join(to)
            message['subject'] = subject

            msg = MIMEText(body)
            message.attach(msg)

            raw = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode('utf-8')
            
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw}
            ).execute()

            return {
                'success': True,
                'messageId': sent_message['id']
            }
        except Exception as e:
            print(f"Error sending email: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def mark_as_read(self, message_id: str) -> bool:
        """Mark an email as read."""
        try:
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            return True
        except Exception as e:
            print(f"Error marking email as read: {e}")
            return False

# FastAPI models
class EmailDraft(BaseModel):
    to: List[str]
    subject: str
    body: str

class EmailId(BaseModel):
    emailId: str

# Dependency to verify Firebase token
async def verify_token(authorization: str = Depends()):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize mail processor
mail_processor = MailProcessor()
mail_processor.authenticate()

# API endpoints
@app.get("/api/mail/sync")
async def sync_emails(user = Depends(verify_token)):
    """Sync emails from Gmail."""
    emails = await mail_processor.get_emails()
    return {"emails": emails}

@app.post("/api/mail/send")
async def send_email(draft: EmailDraft, user = Depends(verify_token)):
    """Send an email."""
    result = await mail_processor.send_email(draft.to, draft.subject, draft.body)
    return result

@app.post("/api/mail/mark-read")
async def mark_email_read(email: EmailId, user = Depends(verify_token)):
    """Mark an email as read."""
    success = await mail_processor.mark_as_read(email.emailId)
    return {"success": success}

@app.post("/api/mail/extract-meeting")
async def extract_meeting(email: EmailId, user = Depends(verify_token)):
    """Extract meeting details from email using AI."""
    # TODO: Implement AI meeting extraction
    return {"meeting": None}

@app.post("/api/mail/extract-task")
async def extract_task(email: EmailId, user = Depends(verify_token)):
    """Extract task details from email using AI."""
    # TODO: Implement AI task extraction
    return {"task": None}

@app.post("/api/mail/generate-response")
async def generate_response(email: EmailId, user = Depends(verify_token)):
    """Generate AI response for email."""
    # TODO: Implement AI response generation
    return {"response": ""}

@app.post("/api/mail/analyze-importance")
async def analyze_importance(email: EmailId, user = Depends(verify_token)):
    """Analyze email importance using AI."""
    # TODO: Implement AI importance analysis
    return {"important": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
