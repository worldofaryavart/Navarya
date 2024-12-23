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

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

class MailProcessor:
    def __init__(self):
        self.creds = None
        self.service = None
        self.authenticate()

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

# Initialize mail processor
mail_processor = MailProcessor()
