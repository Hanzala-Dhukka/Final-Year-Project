"""
MongoDB model for repository analysis documents.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Any, Optional


class RepositoryAnalysis(BaseModel):
    """Schema for repository analysis document in MongoDB."""
    user_id: str
    owner: str
    repository: str
    default_branch: str = "main"
    language: Optional[str] = None
    languages: Dict[str, int] = {}
    language_percentages: Dict[str, float] = {}
    branches: List[str] = []
    files: int = 0
    directories: int = 0
    size: float = 0.0
    dependencies: List[str] = []
    dependency_files: List[str] = []
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    description: str = ""
    topics: List[str] = []
    visibility: str = "public"
    created_at_repo: str = ""
    last_commit: str = ""
    contributors: int = 0
    file_tree: List[str] = []
    status: str = "pending"  # pending | fetching | analyzing | ready | failed
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RepositoryAnalysisResponse(BaseModel):
    """Schema for repository analysis API response."""
    id: Optional[str] = None
    owner: str
    repository: str
    default_branch: str
    language: Optional[str] = None
    languages: Dict[str, float] = {}
    branches: List[str] = []
    files: int = 0
    directories: int = 0
    size: float = 0.0
    dependencies: List[str] = []
    dependency_files: List[str] = []
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    description: str = ""
    topics: List[str] = []
    visibility: str = "public"
    last_commit: str = ""
    contributors: int = 0
    status: str = "ready"
