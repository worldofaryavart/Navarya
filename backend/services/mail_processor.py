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
import logging
from email.utils import parsedate_to_datetime
import json
from firebase_admin import firestore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

class MailProcessor:
    def __init__(self):
        # Get the already initialized Firestore client
        self.db = firestore.client()
        self.user_services = {}

    async def get_user_service(self, user_id: str):
        """Get or create a Gmail service for a specific user."""
        if user_id in self.user_services:
            return self.user_services[user_id]

        # Get user's Gmail credentials from Firestore
        user_doc = await self.db.collection('users').document(user_id).get()
        if not user_doc.exists:
            raise Exception('User not found')

        user_data = user_doc.to_dict()
        if 'gmailCredentials' not in user_data:
            raise Exception('Gmail credentials not found')

        # Create credentials object
        creds = Credentials.from_authorized_user_info(
            json.loads(user_data['gmailCredentials']),
            SCOPES
        )

        # Refresh if expired
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                # Update stored credentials
                await self.db.collection('users').document(user_id).update({
                    'gmailCredentials': json.dumps(creds.to_json())
                })
            else:
                raise Exception('Gmail credentials expired')

        # Build and cache service
        service = build('gmail', 'v1', credentials=creds)
        self.user_services[user_id] = service
        return service

    async def get_emails(self, user_id: str, query: str = '') -> List[Dict[str, Any]]:
        """Get emails matching the query for a specific user."""
        try:
            service = await self.get_user_service(user_id)
            logger.info(f"Fetching emails for user {user_id} with query: {query}")
            
            results = service.users().messages().list(
                userId='me', q=query).execute()
            messages = results.get('messages', [])
            logger.info(f"Found {len(messages)} messages")

            emails = []
            for message in messages:
                try:
                    msg = service.users().messages().get(
                        userId='me', id=message['id'], format='full').execute()
                    
                    headers = msg['payload']['headers']
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                    from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'No Sender')
                    to_email = next((h['value'] for h in headers if h['name'] == 'To'), '')
                    date = next((h['value'] for h in headers if h['name'] == 'Date'), '')

                    # Get email body and attachments
                    body = ''
                    attachments = []
                    if 'parts' in msg['payload']:
                        body = self._get_body_from_parts(msg['payload']['parts'], message['id'])
                        attachments = self._get_attachments(msg['payload']['parts'], message['id'])
                    else:
                        body = base64.urlsafe_b64decode(
                            msg['payload']['body'].get('data', '')
                        ).decode('utf-8') if 'data' in msg['payload']['body'] else ''
                        if msg['payload'].get('mimeType', '').startswith(('application/', 'image/', 'video/', 'audio/')):
                            attachments = self._get_attachments([msg['payload']], message['id'])

                    email_data = {
                        'id': message['id'],
                        'subject': subject,
                        'from': from_email,
                        'to': to_email,
                        'date': date,
                        'body': body,
                        'attachments': attachments,
                        'labels': msg['labelIds'],
                        'read': 'UNREAD' not in msg['labelIds'],
                        'important': 'IMPORTANT' in msg['labelIds']
                    }
                    emails.append(email_data)
                except Exception as e:
                    logger.error(f"Error processing message {message['id']}: {str(e)}")
                    continue

            return emails
        except Exception as e:
            logger.error(f"Error fetching emails: {str(e)}")
            raise

    async def send_email(self, user_id: str, to: List[str], subject: str, body: str) -> bool:
        """Send an email from a specific user's account."""
        try:
            service = await self.get_user_service(user_id)
            message = MIMEMultipart()
            message['to'] = ', '.join(to)
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))
            
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            service.users().messages().send(userId='me', body={'raw': raw}).execute()
            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False

    async def mark_as_read(self, user_id: str, message_id: str) -> None:
        """Mark an email as read for a specific user."""
        try:
            service = await self.get_user_service(user_id)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
        except Exception as e:
            logger.error(f"Error marking email as read: {str(e)}")
            raise

    async def toggle_important(self, user_id: str, email_id: str) -> bool:
        """Toggle the important status of an email for a specific user."""
        try:
            logger.info(f"Toggling important status for email {email_id}")
            service = await self.get_user_service(user_id)
            # Get current labels
            msg = service.users().messages().get(userId='me', id=email_id).execute()
            current_labels = set(msg.get('labelIds', []))
            
            # Toggle STARRED label
            if 'STARRED' in current_labels:
                current_labels.remove('STARRED')
                is_important = False
            else:
                current_labels.add('STARRED')
                is_important = True
            
            # Update labels
            service.users().messages().modify(
                userId='me',
                id=email_id,
                body={'addLabelIds' if is_important else 'removeLabelIds': ['STARRED']}
            ).execute()
            
            logger.info(f"Successfully toggled important status to {is_important}")
            return is_important
        except Exception as e:
            logger.error(f"Error toggling important status: {str(e)}")
            raise

    async def delete_email(self, user_id: str, email_id: str) -> None:
        """Move an email to trash for a specific user."""
        try:
            logger.info(f"Moving email {email_id} to trash")
            service = await self.get_user_service(user_id)
            service.users().messages().trash(userId='me', id=email_id).execute()
            logger.info("Successfully moved email to trash")
        except Exception as e:
            logger.error(f"Error moving email to trash: {str(e)}")
            raise

    async def get_attachment(self, user_id: str, message_id: str, attachment_id: str) -> Optional[Dict[str, Any]]:
        """Download an attachment for a specific user."""
        try:
            logger.info(f"Fetching attachment {attachment_id} from message {message_id}")
            service = await self.get_user_service(user_id)
            attachment = service.users().messages().attachments().get(
                userId='me',
                messageId=message_id,
                id=attachment_id
            ).execute()

            if attachment.get('data'):
                file_data = base64.urlsafe_b64decode(attachment['data'])
                logger.info(f"Successfully retrieved attachment data, size: {len(file_data)} bytes")
                return {
                    'data': file_data,
                    'size': len(file_data)
                }
            logger.warning(f"No data found in attachment {attachment_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting attachment: {str(e)}")
            return None

    def _get_body_from_parts(self, parts: List[Dict[str, Any]], msg_id: str) -> str:
        """Extract email body from message parts."""
        html_body = ''
        plain_body = ''
        embedded_images = {}

        def process_part(part):
            nonlocal html_body, plain_body
            
            # Handle embedded images
            if part.get('mimeType', '').startswith('image/'):
                if 'body' in part and 'attachmentId' in part['body']:
                    cid = next((h['value'] for h in part.get('headers', []) if h['name'].lower() == 'content-id'), '')
                    if cid:
                        # Remove < and > from CID if present
                        cid = cid.strip('<>')
                        attachment = self.service.users().messages().attachments().get(
                            userId='me',
                            messageId=msg_id,
                            id=part['body']['attachmentId']
                        ).execute()
                        
                        if attachment.get('data'):
                            image_data = base64.urlsafe_b64decode(attachment['data'])
                            image_b64 = base64.b64encode(image_data).decode('utf-8')
                            embedded_images[f'cid:{cid}'] = f'data:{part["mimeType"]};base64,{image_b64}'

            # Handle text parts
            if part.get('mimeType') == 'text/html':
                data = part.get('body', {}).get('data', '')
                if data:
                    html_body = base64.urlsafe_b64decode(data).decode('utf-8')
            elif part.get('mimeType') == 'text/plain':
                data = part.get('body', {}).get('data', '')
                if data:
                    plain_body = base64.urlsafe_b64decode(data).decode('utf-8')
            
            # Process nested parts
            if 'parts' in part:
                for p in part['parts']:
                    process_part(p)

        # Process all parts
        for part in parts:
            process_part(part)

        # Replace CID references with actual image data
        if html_body:
            for cid, data_url in embedded_images.items():
                html_body = html_body.replace(f'src="{cid}"', f'src="{data_url}"')
                html_body = html_body.replace(f"src='{cid}'", f"src='{data_url}'")

        # Return HTML if available, otherwise plain text
        return html_body if html_body else plain_body

    def _get_attachments(self, message_parts, message_id):
        """Extract attachments from message parts."""
        attachments = []
        
        def process_part(part):
            """Process a message part for attachments."""
            if part.get('filename') or part.get('mimeType', '').startswith(('application/', 'image/', 'video/', 'audio/')):
                attachment = {
                    'id': part['body'].get('attachmentId'),
                    'name': part.get('filename', 'unnamed_attachment'),
                    'mimeType': part['mimeType'],
                    'size': part['body'].get('size', 0),
                }
                
                # Determine attachment type
                mime_type = part['mimeType'].lower()
                if mime_type.startswith('application/pdf'):
                    attachment['type'] = 'document'
                elif mime_type.startswith('image/'):
                    attachment['type'] = 'image'
                elif mime_type.startswith('video/'):
                    attachment['type'] = 'video'
                elif mime_type.startswith('audio/'):
                    attachment['type'] = 'audio'
                elif mime_type in ['text/calendar', 'application/ics']:
                    attachment['type'] = 'calendar'
                else:
                    attachment['type'] = 'document'
                
                # Format size
                size_bytes = int(attachment['size'])
                if size_bytes < 1024:
                    attachment['size'] = f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    attachment['size'] = f"{size_bytes/1024:.1f} KB"
                else:
                    attachment['size'] = f"{size_bytes/(1024*1024):.1f} MB"
                
                attachments.append(attachment)
            
            # Recursively process parts
            if 'parts' in part:
                for p in part['parts']:
                    process_part(p)
        
        for part in message_parts:
            process_part(part)
        
        return attachments

# Initialize mail processor
mail_processor = MailProcessor()
