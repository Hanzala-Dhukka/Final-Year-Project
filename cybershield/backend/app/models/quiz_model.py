from pydantic import BaseModel

class QuizSubmission(BaseModel):
    session_id: str
    answers: dict
