from typing import Dict, List, Optional
from datetime import datetime
from utils.exceptions import TaskNotFoundError, UnauthorizedError, ValidationError, DatabaseError
from firebase_admin import firestore

class TaskService:
    def __init__(self, db):
        self.db = db

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
            print(f"User ID: {user_id}")
            
            try:
                print("Attempting to fetch tasks from Firestore")
                # Create the base query
                query = self.db.collection('tasks')

                print("Created base query")
                
                # Add where clause
                query = query.where('userId', '==', user_id)
                print("Added user filter")
                
                # Add ordering
                query = query.order_by('createdAt', direction=firestore.Query.DESCENDING)
                print("Added ordering")
                
                # Execute the query
                print("Executing query...")
                tasks = query.stream()
                print("Query executed")
                
                # Convert to list
                print("Converting results")
                result = []
                for task in tasks:
                    task_dict = task.to_dict()
                    task_dict['id'] = task.id
                    result.append(task_dict)
                
                print(f"Successfully fetched {len(result)} tasks")
                return result
                
            except Exception as e:
                print(f"Database error details: {str(e)}")
                raise DatabaseError(f"Error fetching tasks: {str(e)}")
                
        except UnauthorizedError as e:
            print(f"Authorization error: {str(e)}")
            raise e
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
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