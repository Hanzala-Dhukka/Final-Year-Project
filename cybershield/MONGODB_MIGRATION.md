# Module 6.2 — MongoDB Database Migration + Data Layer Setup

## Overview

This module implements the complete MongoDB data layer for CyberShield, replacing Google Sheets with a production-ready MongoDB database. The data layer includes models, repositories, indexes, and all required collections for the platform.

## Architecture

```
React Frontend
    ↓
FastAPI Backend
    ↓
MongoDB Database
    ↓
Collections (15 total)
```

## Implementation Summary

### 1. Database Models

#### User Model (`models/user_model.py`)
```python
- name: str
- email: EmailStr
- password_hash: str
- role: str = "student"
- verified: bool = False
- created_at: datetime
- updated_at: datetime
```

#### Report Model (`models/report_model.py`)
```python
- user_id: str
- scan_type: str  # "github" or "security"
- target: str
- status: str  # "pending", "in_progress", "completed", "failed"
- critical_issues: int
- high_issues: int
- medium_issues: int
- low_issues: int
- findings: List[Dict]
- recommendations: List[str]
```

#### Progress Model (`models/progress_model.py`)
```python
- user_id: str
- xp: int
- level: int
- skill_level: str
- completed_labs: List[str]
- completed_quizzes: List[str]
- achievements: List[str]
- streak_days: int
- owasp_progress: Dict[str, int]
- current_path: Optional[str]
- path_progress: float
```

#### Chat Model (`models/chat_model.py`)
```python
- user_id: str
- conversation_id: str
- messages: List[ChatMessage]
- context: Optional[str]
- status: str  # "active", "closed", "archived"
- last_message_at: datetime
```

### 2. Repository Layer

All repositories follow a consistent pattern with CRUD operations:

#### User Repository (`repositories/user_repository.py`)
- `create_user()` - Create new user
- `get_user_by_email()` - Find user by email
- `get_user_by_id()` - Find user by ID
- `update_user()` - Update user data
- `delete_user()` - Delete user
- `get_all_users()` - Get all users with pagination
- `count_users()` - Count total users

#### Report Repository (`repositories/report_repository.py`)
- `create_report()` - Create new report
- `get_report_by_id()` - Get report by ID
- `get_reports_by_user()` - Get user's reports
- `update_report()` - Update report
- `delete_report()` - Delete report
- `get_recent_reports()` - Get recent reports

#### Progress Repository (`repositories/progress_repository.py`)
- `create_progress()` - Create progress record
- `get_progress_by_user()` - Get user progress
- `update_progress()` - Update progress
- `add_xp()` - Add XP to user
- `create_quiz_attempt()` - Record quiz attempt
- `get_quiz_attempts_by_user()` - Get user's quiz attempts
- `create_lab_attempt()` - Record lab attempt
- `update_lab_attempt()` - Update lab attempt
- `get_lab_attempts_by_user()` - Get user's lab attempts

#### Chat Repository (`repositories/chat_repository.py`)
- `create_conversation()` - Create new conversation
- `get_conversation_by_id()` - Get conversation by ID
- `get_conversation_by_conversation_id()` - Get by conversation_id
- `get_user_conversations()` - Get user's conversations
- `add_message_to_conversation()` - Add message to conversation
- `update_conversation()` - Update conversation
- `delete_conversation()` - Delete conversation
- `close_conversation()` - Close conversation
- `get_recent_conversations()` - Get recent conversations

### 3. Database Collections

The following 15 collections are created automatically on startup:

1. **users** - User accounts and profiles
2. **sessions** - Active user sessions
3. **refresh_tokens** - Refresh token storage
4. **security_reports** - Security scan reports
5. **github_scans** - GitHub repository scans
6. **threat_models** - Threat modeling data
7. **ai_conversations** - AI chat conversations
8. **quiz_attempts** - Quiz attempt history
9. **glossary** - Security glossary terms
10. **labs** - Interactive lab definitions
11. **lab_attempts** - Lab attempt history
12. **achievements** - User achievements
13. **certificates** - User certificates
14. **audit_logs** - System audit logs
15. **progress** - User progress tracking

### 4. Database Indexes

Indexes are created automatically for optimal query performance:

#### Users Collection
```javascript
{ "email": 1 } // Unique
{ "user_id": 1 } // Unique
{ "created_at": 1 }
```

#### Security Reports Collection
```javascript
{ "user_id": 1 }
{ "created_at": 1 }
{ "user_id": 1, "created_at": -1 } // Compound
```

#### AI Conversations Collection
```javascript
{ "conversation_id": 1 } // Unique
{ "user_id": 1 }
{ "last_message_at": 1 }
{ "user_id": 1, "last_message_at": -1 } // Compound
```

#### Progress Collection
```javascript
{ "user_id": 1 } // Unique
{ "updated_at": 1 }
```

#### Quiz Attempts Collection
```javascript
{ "user_id": 1 }
{ "completed_at": 1 }
{ "user_id": 1, "completed_at": -1 } // Compound
```

#### Lab Attempts Collection
```javascript
{ "user_id": 1 }
{ "started_at": 1 }
{ "user_id": 1, "started_at": -1 } // Compound
```

#### Sessions Collection
```javascript
{ "user_id": 1 }
{ "active": 1 }
{ "login_time": 1 }
```

#### Refresh Tokens Collection
```javascript
{ "token_hash": 1 } // Unique
{ "user_id": 1 }
{ "expires_at": 1 }
```

### 5. Database Connection

Updated `app/core/database.py` with:
- Async MongoDB connection using Motor
- Singleton pattern for connection management
- Automatic collection creation
- Automatic index creation
- Graceful connection cleanup

### 6. Environment Configuration

Updated `.env`:
```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=CyberShieldDB
```

## Migration from Google Sheets

### Before (Google Sheets)
```python
# Old approach
import gspread

def save_progress(user_id, xp, level):
    sheet = gc.open("UserProgress").sheet1
    sheet.append_row([user_id, xp, level])
```

### After (MongoDB)
```python
# New approach
from app.repositories.progress_repository import progress_repository

async def save_progress(user_id, xp, level):
    await progress_repository.update_progress(user_id, {
        "xp": xp,
        "level": level
    })
```

## Testing

### Test 1: Database Connection

```bash
curl http://localhost:8000/api/v1/db-test
```

Expected Response:
```json
{
  "database": "connected",
  "database_name": "CyberShieldDB",
  "collections": [
    "users",
    "sessions",
    "refresh_tokens",
    "security_reports",
    "github_scans",
    "threat_models",
    "ai_conversations",
    "quiz_attempts",
    "glossary",
    "labs",
    "lab_attempts",
    "achievements",
    "certificates",
    "audit_logs",
    "progress"
  ]
}
```

### Test 2: Create User

```bash
curl -X POST "http://localhost:8000/api/v1/test/create?name=Hanzala&email=hanzala@test.com"
```

Expected Response:
```json
{
  "message": "User created successfully",
  "user_id": "65abc123def456..."
}
```

### Test 3: Get All Users

```bash
curl http://localhost:8000/api/v1/test/users
```

Expected Response:
```json
[
  {
    "_id": "65abc123def456...",
    "name": "Hanzala",
    "email": "hanzala@test.com",
    "created_at": "2026-07-09T01:00:00.000Z"
  }
]
```

### Test 4: Update User

```bash
curl -X PUT "http://localhost:8000/api/v1/test/user/65abc123...?name=Hanzala+Hatam"
```

Expected Response:
```json
{
  "message": "User updated successfully",
  "modified_count": 1
}
```

### Test 5: Delete User

```bash
curl -X DELETE http://localhost:8000/api/v1/test/user/65abc123...
```

Expected Response:
```json
{
  "message": "User deleted successfully",
  "deleted_count": 1
}
```

## Project Structure

```
backend/
app/
├── core/
│   ├── __init__.py
│   ├── config.py
│   └── database.py          # MongoDB connection & indexes
│
├── config/
│   └── settings.py          # Environment configuration
│
├── models/
│   ├── user_model.py        # User document schema
│   ├── report_model.py      # Report document schema
│   ├── progress_model.py    # Progress document schema
│   └── chat_model.py        # Chat document schema
│
├── repositories/
│   ├── user_repository.py   # User CRUD operations
│   ├── report_repository.py # Report CRUD operations
│   ├── progress_repository.py # Progress CRUD operations
│   └── chat_repository.py   # Chat CRUD operations
│
├── routers/
│   └── test_routes.py       # Test endpoints
│
├── services/
│   └── ...
│
└── main.py                  # FastAPI app with MongoDB startup
```

## Benefits of MongoDB

1. **Performance**: Async operations with Motor
2. **Scalability**: Horizontal scaling with MongoDB
3. **Flexibility**: Schema-less document storage
4. **Query Power**: Rich query language with indexes
5. **Reliability**: Replication and failover
6. **Developer Friendly**: Native Python async support

## Security Considerations

1. **Connection Security**:
   - Use MongoDB Atlas with SSL/TLS
   - Enable authentication
   - Use strong passwords

2. **Access Control**:
   - Create database users with minimal permissions
   - Use IP whitelisting (Atlas)
   - Enable MongoDB authentication

3. **Data Validation**:
   - Use Pydantic models for validation
   - Validate all inputs before database operations
   - Sanitize user inputs

## Troubleshooting

### Issue: Connection refused
**Solution:**
- Check MongoDB is running: `mongod --version`
- Start MongoDB service: `net start MongoDB`
- Verify connection string in `.env`

### Issue: Authentication failed
**Solution:**
- Check username/password in connection string
- Verify database user exists in MongoDB
- Check IP whitelist (Atlas)

### Issue: Motor not installed
**Solution:**
```bash
pip install motor
pip install pymongo
```

### Issue: Collection not found
**Solution:**
- Collections are created automatically on startup
- Check database name in `.env`
- Verify connection with `/api/v1/db-test`

## Next Steps

After completing this module:

1. **Module 6.3**: Migrate user authentication to MongoDB
2. **Module 6.4**: Set up project management collections
3. **Module 6.5**: Configure security scan storage
4. **Module 6.6**: Set up AI conversation storage
5. **Module 6.7**: Configure OWASP progress tracking
6. **Module 6.8**: Set up quiz and learning history
7. **Module 6.9**: Configure reports and certificates
8. **Module 6.10**: Optimize database performance

## Summary

This module provides:
- ✅ Complete MongoDB data layer
- ✅ 4 data models (User, Report, Progress, Chat)
- ✅ 4 repositories with full CRUD operations
- ✅ 15 MongoDB collections
- ✅ Database indexes for performance
- ✅ Async operations with Motor
- ✅ Automatic collection creation
- ✅ Automatic index creation
- ✅ Test endpoints for verification

The backend now has a complete, production-ready MongoDB data layer ready for Phase 6 migration.