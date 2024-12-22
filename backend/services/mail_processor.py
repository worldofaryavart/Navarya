from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os.path
import pickle
from typing import List, Dict, Any
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

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
                sender = next(h['value'] for h in headers if h['name'] == 'From')
                date = next(h['value'] for h in headers if h['name'] == 'Date')

                emails.append({
                    'id': msg['id'],
                    'threadId': msg['threadId'],
                    'subject': subject,
                    'from': sender,
                    'date': date,
                    'snippet': msg['snippet']
                })

            return emails
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send an email."""
        try:
            message = MIMEMultipart()
            message['to'] = to
            message['subject'] = subject

            msg = MIMEText(body)
            message.attach(msg)

            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            self.service.users().messages().send(
                userId='me', body={'raw': raw}).execute()
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    async def analyze_email_content(self, email_id: str) -> Dict[str, Any]:
        """Analyze email content for important information."""
        try:
            msg = self.service.users().messages().get(
                userId='me', id=email_id).execute()
            
            # TODO: Implement AI analysis
            # This will analyze email content for:
            # - Meeting requests
            # - Task requirements
            # - Important deadlines
            # - Required responses
            
            return {
                'requires_response': False,
                'has_meeting': False,
                'has_deadline': False,
                'importance_score': 0
            }
        except Exception as e:
            print(f"Error analyzing email: {e}")
            return {}

    async def generate_response(self, email_id: str) -> str:
        """Generate an AI response to an email."""
        try:
            msg = self.service.users().messages().get(
                userId='me', id=email_id).execute()
            
            # TODO: Implement AI response generation
            # This will generate appropriate responses based on:
            # - Email content
            # - Previous correspondence
            # - Context and tone
            
            return ""
        except Exception as e:
            print(f"Error generating response: {e}")
            return ""

mail_processor = MailProcessor()
