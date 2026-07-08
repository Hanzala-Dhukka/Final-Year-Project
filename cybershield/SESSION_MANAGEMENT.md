# Module 6.3 — Session Management + Auto Logout + Refresh Token System

## Overview

This module implements a comprehensive session management system with automatic logout, refresh tokens, and activity tracking. The system provides secure authentication with token expiration and multi-device session management.

## Architecture

```
User Login
    ↓
Access Token (15 min) + Refresh Token (7 days)
    ↓
MongoDB Session Storage
    ↓
Activity Tracking Middleware
    ↓
Auto Logout After 30 min Inactivity
```

## Implementation Summary

### Backend Components

#### 1. Session Routes (`routers/session_routes.py`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/session/list` | Get all active sessions |
| DELETE | `/api/v1/session/{session_id}` | Logout from specific device |
| POST | `/api/v1/session/logout-all` | Logout from all devices |
| GET | `/api/v1/session/activity` | Get session activity status |

#### 2. Activity Tracker Middleware (`middleware/activity_tracker.py`)

**Features:**
- Tracks user activity on each request
- Checks session expiration (30 minutes inactivity)
- Auto-logout expired sessions
- Updates last_activity timestamp
- Skips tracking for auth endpoints

**How it works:**
1. Intercepts each request
2. Checks if user is authenticated
3. Validates session activity
4. If inactive > 30 minutes, returns 401
5. Otherwise, updates activity timestamp

#### 3. Session Model (`models/session_model.py`)

```python
{
  "_id": ObjectId,
  "user_id": "USER001",
  "refresh_token": "eyJhbGciOiJIUzI1Ni...",
  "device": "Chrome Windows",
  "ip_address": "192.168.1.10",
  "created_at": "2026-07-09T10:00:00Z",
  "last_activity": "2026-07-09T10:20:00Z",
  "expires_at": "2026-07-16T10:00:00Z",
  "active": true
}
```

#### 4. Refresh Token Model (`models/refresh_token_model.py`)

```python
{
  "_id": ObjectId,
  "user_id": "USER001",
  "token_hash": "sha256_hash...",
  "device": "Chrome Windows",
  "ip_address": "192.168.1.10",
  "created_at": "2026-07-09T10:00:00Z",
  "expires_at": "2026-07-16T10:00:00Z",
  "is_revoked": false,
  "last_used": "2026-07-09T10:20:00Z"
}
```

### Frontend Components

#### Settings Page (`frontend/src/pages/Settings.jsx`)

**Features:**
- Display all active sessions
- Show device information (device name, location, IP)
- Show last activity timestamp
- Logout from specific device
- Logout from all devices
- Security information display

**UI Elements:**
- Session cards with device info
- Logout button for each session
- "Logout All Devices" button (if multiple sessions)
- Security information section

### Database Collections

#### Sessions Collection
```javascript
{
  "_id": ObjectId,
  "user_id": String,
  "refresh_token": String,
  "device": String,
  "ip_address": String,
  "created_at": DateTime,
  "last_activity": DateTime,
  "expires_at": DateTime,
  "active": Boolean
}
```

**Indexes:**
```javascript
{ "user_id": 1 }
{ "refresh_token": 1 }
{ "expires_at": 1 } // TTL index for auto-deletion
{ "active": 1 }
```

#### Refresh Tokens Collection
```javascript
{
  "_id": ObjectId,
  "user_id": String,
  "token_hash": String, // SHA-256 hashed
  "device": String,
  "ip_address": String,
  "created_at": DateTime,
  "expires_at": DateTime,
  "is_revoked": Boolean,
  "last_used": DateTime
}
```

**Indexes:**
```javascript
{ "token_hash": 1 } // Unique
{ "user_id": 1 }
{ "expires_at": 1 } // TTL index
```

## Authentication Flow

### Login Flow
```
1. User submits credentials
   ↓
2. Verify password
   ↓
3. Create access token (15 min expiry)
   ↓
4. Create refresh token (7 days expiry)
   ↓
5. Store refresh token in MongoDB (hashed)
   ↓
6. Create session in MongoDB
   ↓
7. Return both tokens to frontend
```

### Token Refresh Flow
```
1. Access token expires (401 response)
   ↓
2. Frontend calls /auth/refresh with refresh token
   ↓
3. Backend verifies refresh token
   ↓
4. Check MongoDB session is active
   ↓
5. Generate new access token
   ↓
6. Update last_used timestamp
   ↓
7. Return new access token
   ↓
8. Frontend retries original request
```

### Logout Flow
```
1. User clicks logout
   ↓
2. Frontend calls /auth/logout
   ↓
3. Backend finds session by refresh token
   ↓
4. Set session.active = false
   ↓
5. Revoke refresh token
   ↓
6. Close all user sessions
   ↓
7. Return success
```

### Auto-Logout Flow
```
1. User makes API request
   ↓
2. ActivityTrackerMiddleware intercepts
   ↓
3. Check last_activity timestamp
   ↓
4. If > 30 minutes inactive:
   - Close session
   - Revoke all refresh tokens
   - Return 401
   ↓
5. Frontend redirects to login
```

## API Endpoints

### Get Active Sessions
**Request:**
```bash
GET /api/v1/session/list
Authorization: Bearer eyJ...
```

**Response:**
```json
[
  {
    "id": "65abc123...",
    "device": "Chrome Windows",
    "location": "Mumbai, India",
    "ip_address": "192.168.1.10",
    "login_time": "2026-07-09T10:00:00Z",
    "last_activity": "2026-07-09T10:20:00Z",
    "active": true
  }
]
```

### Logout Specific Session
**Request:**
```bash
DELETE /api/v1/session/65abc123...
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "message": "Session closed successfully",
  "session_id": "65abc123..."
}
```

### Logout All Sessions
**Request:**
```bash
POST /api/v1/session/logout-all
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "message": "All sessions closed successfully"
}
```

### Get Session Activity
**Request:**
```bash
GET /api/v1/session/activity
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "status": "active",
  "last_activity": "2026-07-09T10:20:00Z",
  "minutes_inactive": 5,
  "device": "Chrome Windows",
  "ip_address": "192.168.1.10"
}
```

## Security Features

### 1. Token Security
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Hashing**: Refresh tokens SHA-256 hashed before storage
- **Rotation**: New access token on each refresh
- **Revocation**: Tokens can be revoked individually or all at once

### 2. Session Security
- **Multi-Device**: Track all active sessions
- **Activity Tracking**: Monitor last activity per session
- **Auto-Logout**: 30 minutes inactivity timeout
- **Session Listing**: Users can view all active sessions
- **Device Logout**: Users can logout specific devices

### 3. Middleware Security
- **Auto-Logout**: Automatic logout after inactivity
- **Activity Updates**: Track all user activity
- **Session Validation**: Check session status on each request
- **Token Cleanup**: TTL indexes for automatic cleanup

## Configuration

### Environment Variables
```env
# Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Session Settings
SESSION_INACTIVITY_TIMEOUT=30  # minutes
```

### Middleware Configuration
```python
app.add_middleware(
    ActivityTrackerMiddleware,
    inactivity_timeout=30  # minutes
)
```

## Testing

### Test 1: Login and Get Sessions
```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# Get sessions
curl http://localhost:8000/api/v1/session/list \
  -H "Authorization: Bearer eyJ..."
```

### Test 2: Logout Specific Session
```bash
curl -X DELETE http://localhost:8000/api/v1/session/65abc123... \
  -H "Authorization: Bearer eyJ..."
```

### Test 3: Logout All Sessions
```bash
curl -X POST http://localhost:8000/api/v1/session/logout-all \
  -H "Authorization: Bearer eyJ..."
```

### Test 4: Auto-Logout After Inactivity
1. Login to the application
2. Wait 30 minutes without activity
3. Make any API request
4. Expected: 401 Unauthorized
5. Redirect to login page

### Test 5: Token Refresh
1. Login and wait 15 minutes
2. Make an API request
3. Frontend automatically calls /auth/refresh
4. Request succeeds with new token
5. No user interruption

## Frontend Testing

### Test 1: View Active Sessions
1. Login to the application
2. Navigate to Settings page
3. Verify active sessions are displayed
4. Check device information is shown

### Test 2: Logout from Device
1. Go to Settings page
2. Click "Logout" on a specific session
3. Verify session is removed from list
4. Verify that device is logged out

### Test 3: Logout All Devices
1. Login from multiple devices
2. Go to Settings on one device
3. Click "Logout All Devices"
4. Verify all devices are logged out

### Test 4: Auto-Logout
1. Login to the application
2. Wait 30 minutes without activity
3. Try to access any page
4. Expected: Redirected to login page

### Test 5: Token Refresh
1. Login and keep the page open
2. Wait 15 minutes
3. Click on any link or make any request
4. Expected: Request succeeds without interruption
5. No login required

## MongoDB Indexes

### TTL Indexes for Auto-Cleanup

MongoDB automatically deletes expired documents using TTL indexes:

```python
# Sessions collection
await sessions_collection.create_index("expires_at", expireAfterSeconds=0)

# Refresh tokens collection
await tokens_collection.create_index("expires_at", expireAfterSeconds=0)
```

This ensures:
- Expired sessions are automatically removed
- Expired refresh tokens are automatically removed
- No manual cleanup required
- Database stays clean and performant

## Background Tasks

### Session Cleanup Task
Run periodically to clean up inactive sessions:

```python
from app.middleware.activity_tracker import cleanup_inactive_sessions_task

# In scheduler
scheduler.add_job(
    cleanup_inactive_sessions_task,
    "interval",
    minutes=30
)
```

## Migration from Old System

### Before (No Session Management)
```python
# Old approach
@app.post("/login")
def login():
    # Create JWT token
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token}
```

### After (With Session Management)
```python
# New approach
@app.post("/login")
async def login():
    # Create access token
    access_token = create_access_token(...)
    
    # Create refresh token
    refresh_token = create_refresh_token(...)
    
    # Store refresh token in MongoDB
    await store_refresh_token(user_id, refresh_token)
    
    # Create session
    await create_session(user_id, device, ip)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
```

## Troubleshooting

### Issue: Users logged out after 15 minutes
**Solution:**
- Ensure frontend is using refresh token
- Check refresh endpoint is working
- Verify refresh token is stored in localStorage

### Issue: Sessions not showing in Settings
**Solution:**
- Check session creation on login
- Verify MongoDB sessions collection
- Ensure user_id matches correctly

### Issue: Auto-logout not working
**Solution:**
- Verify middleware is added in main.py
- Check inactivity_timeout is set correctly
- Review middleware logs

### Issue: Token refresh fails
**Solution:**
- Check refresh token exists in localStorage
- Verify token hasn't expired (7 days)
- Check MongoDB for revoked tokens

## Summary

This module provides:
- ✅ Access token expiration (15 minutes)
- ✅ Refresh token system (7 days)
- ✅ Session storage in MongoDB
- ✅ Auto-logout after 30 minutes inactivity
- ✅ Multi-device session management
- ✅ Active session tracking
- ✅ Token revocation
- ✅ Frontend settings page
- ✅ Automatic token refresh
- ✅ TTL indexes for auto-cleanup

The authentication system now provides enterprise-grade security with proper session management, automatic logout, and seamless user experience.