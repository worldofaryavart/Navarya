from fastapi import HTTPException
from typing import Optional, Dict, Any

class TaskException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        additional_info: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.additional_info = additional_info

class TaskNotFoundError(TaskException):
    def __init__(self, task_id: str):
        super().__init__(
            status_code=404,
            detail=f"Task with ID {task_id} not found",
            error_code="TASK_NOT_FOUND"
        )

class UnauthorizedError(TaskException):
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(
            status_code=403,
            detail=message,
            error_code="UNAUTHORIZED_ACCESS"
        )

class ValidationError(TaskException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="VALIDATION_ERROR"
        )

class DatabaseError(TaskException):
    def __init__(self, operation: str):
        super().__init__(
            status_code=500,
            detail=f"Database error during {operation}",
            error_code="DATABASE_ERROR"
        )
