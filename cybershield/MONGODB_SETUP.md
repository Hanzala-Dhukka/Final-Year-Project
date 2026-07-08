# Module 6.1 — MongoDB Setup + FastAPI Connection

## Overview

This module implements MongoDB as the primary database for the CyberShield platform, replacing the previous Google Sheets integration. The system now uses FastAPI with async MongoDB connections using the Motor library.

## Implementation Summary

### Backend Components

#### 1. Database Configuration (`app/core/database.py`)
Updated to use **Motor** (async MongoDB driver):
- `AsyncIOMotorClient` for async database operations
- Singleton pattern for connection management
- Async connection functions for FastAPI lifecycle
- Automatic collection creation on startup

**Key Features:**
- Async database operations (non-blocking)
- Singleton pattern for single connection
- Automatic connection testing
- Graceful connection cleanup

#### 2. Settings Configuration (`app/config/settings.py`)
Environment variables:
```python
MONGO_URI = os.getenv("MONGO_URI")  # MongoDB connection string
DATABASE_NAME = os.getenv("DATABASE_NAME")  # Database name
```

Updated token expiry settings:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Changed from 60
REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # New setting
```

#### 3. Environment Variables (`.env`)
```env
# Database
DATABASE_URL=mongodb://localhost:27017/
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=CyberShieldDB

# Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

#### 4. Test Routes (`app/routers/test_routes.py`)
CRUD test endpoints for database verification:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/db-test` | Test connection and list collections |
| POST | `/api/v1/test/create?name=X&email=Y` | Create test user |
| GET | `/api/v1/test/users` | Get all test users |
| GET | `/api/v1/test/user/{id}` | Get user by ID |
| PUT | `/api/v1/test/user/{id}?name=X&email=Y` | Update user |
| DELETE | `/api/v1/test/user/{id}` | Delete user |

#### 5. Main Application (`app/main.py`)
Updated with:
- MongoDB connection on startup
- Test router registration
- Graceful shutdown with connection cleanup

## MongoDB Connection Flow

```
Application Startup
    ↓
Load Environment Variables
    ↓
Create AsyncIOMotorClient
    ↓
Connect to MongoDB
    ↓
Ensure Collections Exist
    ↓
Application Ready
```

## Installation

### 1. Install MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/atlas
2. Create a cluster
3. Create database user
4. Get connection string
5. Update `.env` with connection string

**Option B: Local MongoDB**
1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service
4. Connection: `mongodb://localhost:27017`

### 2. Install Python Packages

```bash
cd Final-Year-Project/cybershield/backend
pip install motor pymongo
```

Verify installation:
```bash
pip list | findstr motor
pip list | findstr pymongo
```

Expected output:
```
motor
pymongo
```

### 3. Configure Environment

Update `backend/.env`:
```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=CyberShieldDB

# For MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
# DATABASE_NAME=CyberShieldDB
```

### 4. Run the Application

```bash
cd Final-Year-Project/cybershield/backend
uvicorn app.main:app --reload
```

Expected console output:
```
MongoDB client connected successfully to mongodb://localhost:27017
Database 'CyberShieldDB' selected
Collection 'users' already exists
MongoDB connected successfully
Scheduler started. Monitoring jobs scheduled every 30 minutes.
```

## Testing

### Test 1: Database Connection Test

**Request:**
```bash
curl http://localhost:8000/api/v1/db-test
```

**Expected Response:**
```json
{
  "database": "connected",
  "database_name": "CyberShieldDB",
  "collections": ["users", "refresh_tokens", "sessions", ...]
}
```

### Test 2: Create User

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/test/create?name=Hanzala&email=hanzala@test.com"
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user_id": "65abc123def456..."
}
```

### Test 3: Get All Users

**Request:**
```bash
curl http://localhost:8000/api/v1/test/users
```

**Expected Response:**
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

### Test 4: Get User by ID

**Request:**
```bash
curl http://localhost:8000/api/v1/test/user/65abc123def456...
```

**Expected Response:**
```json
{
  "_id": "65abc123def456...",
  "name": "Hanzala",
  "email": "hanzala@test.com",
  "created_at": "2026-07-09T01:00:00.000Z"
}
```

### Test 5: Update User

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/test/user/65abc123def456...?name=Hanzala+Hatam"
```

**Expected Response:**
```json
{
  "message": "User updated successfully",
  "modified_count": 1
}
```

### Test 6: Delete User

**Request:**
```bash
curl -X DELETE http://localhost:8000/api/v1/test/user/65abc123def456...
```

**Expected Response:**
```json
{
  "message": "User deleted successfully",
  "deleted_count": 1
}
```

## MongoDB Compass

### Install MongoDB Compass
Download from: https://www.mongodb.com/try/download/compass

### Connect to Database
1. Open MongoDB Compass
2. Use same connection string as `.env`:
   - Local: `mongodb://localhost:27017`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net`
3. Click "Connect"

### Verify Database
1. Select database: `CyberShieldDB`
2. View collections: `users`, `refresh_tokens`, `sessions`
3. Browse documents in each collection

## Project Structure

```
backend/
app/
│
├── main.py                    # FastAPI app with MongoDB startup
│
├── core/
│   ├── __init__.py
│   ├── config.py
│   └── database.py           # MongoDB async connection
│
├── config/
│   └── settings.py           # Environment configuration
│
├── models/
│   ├── user_model.py
│   └── refresh_token_model.py
│
├── routers/
│   ├── test_routes.py        # CRUD test endpoints
│   └── ...
│
├── services/
│   └── ...
│
└── .env                      # Environment variables
```

## Migration from Google Sheets

### Before (Google Sheets)
```
React Frontend
    ↓
FastAPI Backend
    ↓
Google Sheets API
    ↓
Spreadsheet
```

### After (MongoDB)
```
React Frontend
    ↓
FastAPI Backend
    ↓
Motor (Async MongoDB)
    ↓
MongoDB Database
    ↓
Collections (users, scans, reports, etc.)
```

## Benefits of MongoDB

1. **Performance**: Async operations with Motor
2. **Scalability**: Horizontal scaling with MongoDB
3. **Flexibility**: Schema-less document storage
4. **Query Power**: Rich query language
5. **Reliability**: Replication and failover
6. **Developer Friendly**: Native Python support

## Security Considerations

1. **Connection Security**:
   - Use MongoDB Atlas with SSL/TLS
   - Enable authentication
   - Use strong passwords

2. **Environment Variables**:
   - Never commit `.env` to git
   - Use different credentials for dev/prod
   - Rotate credentials regularly

3. **Access Control**:
   - Create database users with minimal permissions
   - Use IP whitelisting (Atlas)
   - Enable MongoDB authentication

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
- Collections are created automatically on first insert
- Check database name in `.env`
- Verify connection with `/api/v1/db-test`

## Next Steps

After completing this module:

1. **Module 6.2**: Create database models for all collections
2. **Module 6.3**: Migrate user authentication to MongoDB
3. **Module 6.4**: Set up project management collections
4. **Module 6.5**: Configure security scan storage
5. **Module 6.6**: Set up AI conversation storage
6. **Module 6.7**: Configure OWASP progress tracking
7. **Module 6.8**: Set up quiz and learning history
8. **Module 6.9**: Configure reports and certificates
9. **Module 6.10**: Optimize database performance

## Summary

This module provides:
- ✅ MongoDB connection with Motor (async)
- ✅ Environment configuration
- ✅ Database test endpoints
- ✅ CRUD operations verified
- ✅ Startup/shutdown lifecycle
- ✅ Collection auto-creation
- ✅ MongoDB Compass integration

The backend is now connected to MongoDB and ready for data operations.