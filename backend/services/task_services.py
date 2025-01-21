from typing import Dict, List, Optional
from datetime import datetime, timedelta
from utils.exceptions import TaskNotFoundError, UnauthorizedError, ValidationError, DatabaseError
from firebase_admin import firestore
import time
import pytz
from functools import lru_cache

class TaskService:
    def __init__(self, db):
        self.db = db
        self._task_cache = {}
        self._last_fetch = {}
        self._cache_duration = timedelta(minutes=5)  # Cache for 5 minutes
        self.DEFAULT_PAGE_SIZE = 100
        self.timezone = pytz.timezone('Asia/Kolkata')  # IST timezone

    def _get_cached_tasks(self, user_id: str) -> Optional[List[Dict]]:
        """Get cached tasks if they exist and are not expired"""
        if user_id in self._task_cache:
            last_fetch = self._last_fetch.get(user_id)
            if last_fetch and datetime.now() - last_fetch < self._cache_duration:
                return self._task_cache[user_id]
        return None

    def _cache_tasks(self, user_id: str, tasks: List[Dict]):
        """Cache tasks for a user"""
        self._task_cache[user_id] = tasks
        self._last_fetch[user_id] = datetime.now()

    def _clear_task_cache(self, user_id: str):
        """Clear the cache for a specific user"""
        if user_id in self._task_cache:
            del self._task_cache[user_id]
        if user_id in self._last_fetch:
            del self._last_fetch[user_id]

    def _serialize_timestamp(self, timestamp) -> str:
        """Convert Firestore timestamp to formatted string"""
        if timestamp is None:
            return None
            
        if isinstance(timestamp, type(firestore.SERVER_TIMESTAMP)):
            return None
            
        try:
            # Convert to datetime if it's a Firestore Timestamp
            if isinstance(timestamp, firestore.Timestamp):
                dt = timestamp.datetime
            elif isinstance(timestamp, datetime):
                dt = timestamp
            else:
                return str(timestamp)
                
            # Convert to IST timezone
            ist_dt = dt.astimezone(self.timezone)
            return ist_dt.strftime("%d %B %Y at %H:%M:%S UTC+5:30")
        except Exception as e:
            print(f"Error serializing timestamp: {str(e)}")
            return str(timestamp)

    def _parse_date_to_timestamp(self, date_str: Optional[str]) -> Optional[datetime]:
        """Convert date string to Firestore Timestamp"""
        if not date_str:
            return None
            
        try:
            # Try parsing the formatted string
            if isinstance(date_str, str) and "at" in date_str:
                # Remove UTC offset and parse
                date_str = date_str.split(" UTC")[0]
                dt = datetime.strptime(date_str, "%d %B %Y at %H:%M:%S")
                # Add timezone info
                dt = self.timezone.localize(dt)
            else:
                # Try parsing as ISO format or other formats
                dt = datetime.fromisoformat(str(date_str))
                if dt.tzinfo is None:
                    dt = self.timezone.localize(dt)
            
            return dt
        except ValueError as e:
            raise ValidationError(f"Invalid date format: {str(e)}")

    def validate_task_data(self, task_data: Dict) -> None:
        required_fields = ['title']
        missing_fields = [field for field in required_fields if not task_data.get(field)]
        if missing_fields:
            raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
            
        # Validate and convert date fields if present
        date_fields = ['due_date', 'reminder']
        for field in date_fields:
            if field in task_data and task_data[field]:
                try:
                    # Convert to timestamp format
                    task_data[field] = self._parse_date_to_timestamp(task_data[field])
                except ValueError:
                    raise ValidationError(f"Invalid date format for {field}")
                    
        # Validate other fields
        if 'priority' in task_data:
            valid_priorities = ['High', 'Medium', 'Low']
            if task_data['priority'] not in valid_priorities:
                raise ValidationError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")
                
        if 'status' in task_data:
            valid_statuses = ['Pending', 'In Progress', 'Completed']
            if task_data['status'] not in valid_statuses:
                raise ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    async def verify_user(self, token: str) -> str:
        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(token)
            return decoded_token['uid']
        except Exception as e:
            raise UnauthorizedError("Invalid or expired token")

    async def add_task(self, task_data: Dict, user_id: str) -> Dict:
        try:
            self.validate_task_data(task_data)
            print("user id in add _task : ", user_id)
            
            # Convert date fields to Firestore timestamps
            if 'due_date' in task_data:
                task_data['due_date'] = task_data['due_date']
            if 'reminder' in task_data:
                task_data['reminder'] = task_data['reminder']
            
            task_data['userId'] = user_id
            task_data['createdAt'] = firestore.SERVER_TIMESTAMP
            task_data['status'] = task_data.get('status', 'Pending')
            
            try:
                doc_ref = self.db.collection('tasks').document()
                doc_ref.set(task_data)
                self._clear_task_cache(user_id)
                
                # Get the created task with server timestamp
                created_task = doc_ref.get().to_dict()
                # Serialize timestamps for response
                if 'createdAt' in created_task:
                    created_task['createdAt'] = self._serialize_timestamp(created_task['createdAt'])
                if 'due_date' in created_task:
                    created_task['due_date'] = self._serialize_timestamp(created_task['due_date'])
                if 'reminder' in created_task:
                    created_task['reminder'] = self._serialize_timestamp(created_task['reminder'])
                
                return {**created_task, 'id': doc_ref.id}
                
            except Exception as e:
                raise DatabaseError(f"Error adding task: {str(e)}")
                
        except (UnauthorizedError, ValidationError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error adding task: {str(e)}")

    async def get_tasks(self, token: str, page_size: int = None) -> List[Dict]:
        try:
            user_id = await self.verify_user(token)
            # Check cache first
            cached_tasks = self._get_cached_tasks(user_id)
            if cached_tasks is not None:
                return cached_tasks

            try:
                tasks_ref = self.db.collection('tasks')
                query = (
                    tasks_ref
                    .where('userId', '==', user_id)
                    .order_by('createdAt', direction=firestore.Query.DESCENDING)
                    .limit(page_size or self.DEFAULT_PAGE_SIZE)
                )

                docs = query.stream()  # Using stream() for better memory usage

                result = []
                for doc in docs:
                    task_data = doc.to_dict()
                    task_data['id'] = doc.id
                    
                    # Serialize all timestamp fields
                    for field in ['createdAt', 'due_date', 'reminder']:
                        if field in task_data:
                            task_data[field] = self._serialize_timestamp(task_data[field])
                    
                    result.append(task_data)
                
                self._cache_tasks(user_id, result)
                return result
                
            except Exception as e:
                print(f"Database error details: {str(e)}")
                raise DatabaseError(f"Error fetching tasks: {str(e)}")

        except UnauthorizedError as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error fetching tasks: {str(e)}")

    def _update_task_transaction(self, transaction, task_ref, updates, user_id):
        snapshot = task_ref.get(transaction=transaction)
        if not snapshot.exists:
            raise TaskNotFoundError(task_ref.id)
            
        task_dict = snapshot.to_dict()
        if task_dict['userId'] != user_id:
            raise UnauthorizedError("Not authorized to update this task")
        
        transaction.update(task_ref, updates)
        return {'id': task_ref.id, **updates}

    async def update_task(self, task_id: str, task_data: Dict, token: str) -> Dict:
        try:
            user_id = await self.verify_user(token)
            self.validate_task_data(task_data)
            
            try:
                task_ref = self.db.collection('tasks').document(task_id)
                updates = {k: v for k, v in {
                    'title': task_data.get('title'),
                    'description': task_data.get('description'),
                    'status': task_data.get('status'),
                    'priority': task_data.get('priority'),
                    'due_date': task_data.get('due_date'),
                    'reminder': task_data.get('reminder')
                }.items() if v is not None}  # Only include non-None values
                
                # Execute the transaction
                @firestore.transactional
                def update_transaction(transaction):
                    return self._update_task_transaction(transaction, task_ref, updates, user_id)
                
                transaction = self.db.transaction()
                result = update_transaction(transaction)
                
                self._clear_task_cache(user_id)
                return result
                
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError(f"Error updating task: {str(e)}")
                
        except (UnauthorizedError, ValidationError, TaskNotFoundError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error updating task: {str(e)}")

    async def delete_task(self, task_id: str, token: str) -> Dict:
        try:
            user_id = await self.verify_user(token)
            
            try:
                task_ref = self.db.collection('tasks').document(task_id)
                task = task_ref.get()
                
                if not task.exists:
                    raise TaskNotFoundError(task_id)
                    
                task_dict = task.to_dict()
                if task_dict['userId'] != user_id:
                    raise UnauthorizedError("Not authorized to delete this task")
                
                task_ref.delete()
                self._clear_task_cache(user_id)
                return {"message": "Task deleted successfully", "id": task_id}
                
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError(f"Error deleting task: {str(e)}")
                
        except (UnauthorizedError, TaskNotFoundError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error deleting task: {str(e)}")

    async def get_task_by_id(self, task_id: str, token: str) -> Dict:
        try:
            user_id = await self.verify_user(token)
            
            try:
                task_ref = self.db.collection('tasks').document(task_id)
                task = task_ref.get()
                
                if not task.exists:
                    raise TaskNotFoundError(task_id)
                    
                task_dict = task.to_dict()
                if task_dict['userId'] != user_id:
                    raise UnauthorizedError("Not authorized to view this task")
                
                if 'createdAt' in task_dict:
                    task_dict['createdAt'] = self._serialize_timestamp(task_dict['createdAt'])
                
                return {'id': task_id, **task_dict}
                
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError(f"Error fetching task: {str(e)}")
                
        except (UnauthorizedError, TaskNotFoundError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error fetching task: {str(e)}")