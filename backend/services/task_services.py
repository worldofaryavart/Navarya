from typing import Dict, List, Optional
from datetime import datetime, timedelta
from utils.exceptions import TaskNotFoundError, UnauthorizedError, ValidationError, DatabaseError
from firebase_admin import firestore
import time
from functools import lru_cache

class TaskService:
    def __init__(self, db):
        self.db = db
        self._task_cache = {}
        self._last_fetch = {}
        self._cache_duration = timedelta(minutes=5)  # Cache for 5 minutes

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

    def validate_task_data(self, task_data: Dict) -> None:
        required_fields = ['title', 'description', 'priority']
        missing_fields = [field for field in required_fields if not task_data.get(field)]
        if missing_fields:
            raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
        
        priority = task_data.get('priority', '').lower()
        if priority not in ['low', 'medium', 'high']:
            raise ValidationError("Priority must be one of: low, medium, high")

    async def verify_user(self, token: str) -> str:
        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(token)
            return decoded_token['uid']
        except Exception as e:
            raise UnauthorizedError("Invalid or expired token")

    async def add_task(self, task_data: Dict, token: str) -> Dict:
        try:
            user_id = await self.verify_user(token)
            self.validate_task_data(task_data)
            
            task_data['userId'] = user_id
            task_data['createdAt'] = datetime.utcnow()
            task_data['status'] = task_data.get('status', 'Pending')
            
            try:
                doc_ref = self.db.collection('tasks').document()
                doc_ref.set(task_data)
                # Clear cache when adding new task
                self._clear_task_cache(user_id)
                return {**task_data, 'id': doc_ref.id}
            except Exception as e:
                raise DatabaseError("adding task")
                
        except (UnauthorizedError, ValidationError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error adding task: {str(e)}")

    async def get_tasks(self, token: str) -> List[Dict]:
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
                )
                
                docs = query.get()
                
                result = []
                for doc in docs:
                    task_data = doc.to_dict()
                    task_data['id'] = doc.id
                    if 'createdAt' in task_data and task_data['createdAt']:
                        task_data['createdAt'] = task_data['createdAt'].isoformat()
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

    async def update_task(self, task_id: str, task_data: Dict, token: str) -> Dict:
        try:
            user_id = await self.verify_user(token)
            self.validate_task_data(task_data)
            
            try:
                task_ref = self.db.collection('tasks').document(task_id)
                task = task_ref.get()
                
                if not task.exists:
                    raise TaskNotFoundError(task_id)
                    
                task_dict = task.to_dict()
                if task_dict['userId'] != user_id:
                    raise UnauthorizedError("Not authorized to update this task")
                
                updates = {
                    'title': task_data.get('title'),
                    'description': task_data.get('description'),
                    'status': task_data.get('status'),
                    'priority': task_data.get('priority'),
                    'dueDate': task_data.get('dueDate'),
                    'reminder': task_data.get('reminder')
                }
                
                task_ref.update(updates)
                # Clear cache when updating task
                self._clear_task_cache(user_id)
                return {'id': task_id, **updates}
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError("updating task")
                
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
                # Clear cache when deleting task
                self._clear_task_cache(user_id)
                return {"message": "Task deleted successfully", "id": task_id}
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError("deleting task")
                
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
                
                return {'id': task_id, **task_dict}
            except Exception as e:
                if isinstance(e, (TaskNotFoundError, UnauthorizedError)):
                    raise e
                raise DatabaseError("fetching task")
                
        except (UnauthorizedError, TaskNotFoundError, DatabaseError) as e:
            raise e
        except Exception as e:
            raise DatabaseError(f"Error fetching task: {str(e)}")