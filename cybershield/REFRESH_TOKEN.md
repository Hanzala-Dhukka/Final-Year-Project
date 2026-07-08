# Module 5.3 — Refresh Token & Session Management

## Overview

This module implements a professional authentication flow with refresh tokens and session management. Users no longer need to log in every 15 minutes when their access token expires. The system automatically refreshes the access token using a long-lived refresh token.

## Architecture

```
User Login
    ↓
Access Token (15 min) + Refresh Token (7 days)
    ↓
Access Token Expires
    ↓
Frontend sends Refresh Token
    ↓
Backend generates new Access Token
    ↓
User continues working (no interruption)
```

## Implementation Summary

### Backend Components

#### 1. Models (`app/models/refresh_token_model.py`)
- `RefreshTokenCreate` - Schema for creating refresh tokens
- `RefreshTokenInDB` - Database document structure
- `SessionInDB` - Session document structure
- `SessionResponse` - API response schema

#### 2. Security Utilities (`app/utils/security.py`)
Enhanced with:
- `create_access_token()` - Creates JWT access token (15 min expiry)
- `create_refresh_token()` - Creates JWT refresh token (7 days expiry)
- `verify_token()` - Verifies and decodes JWT tokens
- `get_token_expiry_seconds()` - Returns access token expiry in seconds
- `get_refresh_token_expiry_seconds()` - Returns refresh token expiry in seconds

#### 3. Repositories

**Refresh Token Repository (`app/repositories/refresh_token_repository.py`)**
- `create_refresh_token()` - Stores hashed refresh token in MongoDB
- `get_token_by_hash()` - Retrieves token by hash
- `revoke_token()` - Revokes a specific token
- `revoke_all_user_tokens()` - Revokes all user tokens
- `update_last_used()` - Updates last used timestamp
- `get_user_tokens()` - Gets all active tokens for user
- `cleanup_expired_tokens()` - Removes expired tokens

**Session Repository (`app/repositories/session_repository.py`)**
- `create_session()` - Creates new session
- `get_user_sessions()` - Gets all active sessions
- `get_session_by_id()` - Gets session by ID
- `close_session()` - Closes specific session
- `close_all_user_sessions()` - Closes all user sessions
- `update_session_activity()` - Updates last activity
- `cleanup_inactive_sessions()` - Marks inactive sessions

#### 4. Services

**Refresh Service (`app/services/refresh_service.py`)**
- `create_refresh_token_for_user()` - Creates and stores refresh token
- `refresh_access_token()` - Generates new access token from refresh token
- `revoke_refresh_token()` - Revokes specific token
- `revoke_all_user_tokens()` - Revokes all user tokens

**Session Service (`app/services/session_service.py`)**
- `create_session()` - Creates new user session
- `get_user_sessions()` - Retrieves user sessions
- `close_session()` - Closes specific session
- `logout_user()` - Logs out user from all/specific sessions
- `cleanup_inactive_sessions()` - Cleans up inactive sessions
- `update_user_activity()` - Updates user last activity

#### 5. Auth Routes (`app/routes/auth_routes.py`)

**Updated Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/sessions` | Get active sessions |
| DELETE | `/api/v1/auth/sessions/{id}` | Close specific session |

### Frontend Components

#### 1. API Client (`frontend/src/api/api.js`)
Enhanced with:
- **Request Interceptor**: Automatically adds Bearer token to requests
- **Response Interceptor**: Handles 401 errors and auto-refreshes tokens
- **Token Refresh Flow**: 
  1. Detects 401 error
  2. Calls `/auth/refresh` with refresh token
  3. Updates localStorage with new access token
  4. Retries original request
  5. Redirects to login if refresh fails

#### 2. Login Page (`frontend/src/pages/Login.jsx`)
Updated to:
- Store both access and refresh tokens in localStorage
- Handle token refresh errors gracefully

## MongoDB Collections

### Collection: refresh_tokens
```javascript
{
  "_id": ObjectId,
  "user_id": "65ab123",
  "token_hash": "8s7df89sdf", // SHA-256 hashed
  "device": "Chrome Windows",
  "ip_address": "192.168.1.10",
  "created_at": "2026-07-09T10:30:00Z",
  "expires_at": "2026-07-16T10:30:00Z",
  "is_revoked": false,
  "revoked_at": null,
  "last_used": "2026-07-09T11:00:00Z"
}
```

### Collection: sessions
```javascript
{
  "_id": ObjectId,
  "user_id": "65ab123",
  "login_time": "2026-07-09T10:30:00Z",
  "logout_time": null,
  "device": "Chrome Windows",
  "ip_address": "192.168.1.10",
  "location": "India",
  "active": true,
  "last_activity": "2026-07-09T11:00:00Z"
}
```

## API Response Examples

### Login Response
**Request:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Refresh Token Response
**Request:**
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

### Logout Response
**Request:**
```bash
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (optional)
}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### Get Sessions Response
**Request:**
```bash
GET /api/v1/auth/sessions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "65abc123...",
      "device": "Chrome Windows",
      "location": "India",
      "ip_address": "192.168.1.10",
      "login_time": "2026-07-09T10:30:00Z",
      "last_activity": "2026-07-09T11:00:00Z",
      "active": true
    }
  ]
}
```

### Close Session Response
**Request:**
```bash
DELETE /api/v1/auth/sessions/65abc123...
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Session closed successfully"
}
```

## Security Features

### 1. Token Security
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Hashing**: Refresh tokens are SHA-256 hashed before storage
- **Rotation**: New access token on each refresh
- **Revocation**: Tokens can be revoked individually or all at once

### 2. Session Management
- **Multiple Devices**: Users can login from multiple devices
- **Session Tracking**: Track all active sessions
- **Force Logout**: Users can close specific sessions
- **Activity Tracking**: Monitor last activity per session
- **Auto Cleanup**: Inactive sessions automatically closed after 30 minutes

### 3. Frontend Security
- **Automatic Refresh**: Tokens refreshed before expiry
- **Secure Storage**: Tokens stored in localStorage
- **Auto Logout**: Redirects to login if refresh fails
- **Request Retry**: Failed requests retried with new token

## Environment Variables

Add to `.env`:

```env
# Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# JWT Settings
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

## Testing

### Test 1: Login
```bash
POST /api/v1/auth/login

{
  "email": "user@example.com",
  "password": "password123"
}

Expected: 200 OK
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 900
}
```

### Test 2: Use API with Access Token
```bash
GET /api/v1/auth/me
Authorization: Bearer eyJ...

Expected: 200 OK (user data)
```

### Test 3: Refresh Access Token
```bash
POST /api/v1/auth/refresh

{
  "refresh_token": "eyJ..."
}

Expected: 200 OK
{
  "access_token": "new_eyJ...",
  "expires_in": 900
}
```

### Test 4: Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer eyJ...

{
  "refresh_token": "eyJ..." (optional)
}

Expected: 200 OK
{
  "message": "Successfully logged out"
}
```

### Test 5: Get Sessions
```bash
GET /api/v1/auth/sessions
Authorization: Bearer eyJ...

Expected: 200 OK
{
  "sessions": [...]
}
```

### Test 6: Close Session
```bash
DELETE /api/v1/auth/sessions/{session_id}
Authorization: Bearer eyJ...

Expected: 200 OK
{
  "message": "Session closed successfully"
}
```

## Frontend Testing

### Test 1: Login Flow
1. Navigate to login page
2. Enter credentials
3. Click login
4. Verify both tokens stored in localStorage
5. Verify redirect to dashboard

### Test 2: Automatic Token Refresh
1. Login and navigate to a protected page
2. Wait for access token to expire (or manually expire it)
3. Make an API request
4. Verify request succeeds (auto-refresh)
5. Verify no interruption to user

### Test 3: Logout
1. Click logout button
2. Verify tokens removed from localStorage
3. Verify redirect to login page
4. Verify cannot access protected routes

### Test 4: Multiple Sessions
1. Login from Chrome
2. Login from Firefox (incognito)
3. View sessions page
4. Verify both sessions listed
5. Close one session
6. Verify that session is logged out

## Migration Guide

### For Existing Users
If you have existing users with old authentication:

1. **Option 1: Force re-login**
   - Clear all existing tokens
   - Users must login again
   - New tokens issued with refresh capability

2. **Option 2: Gradual migration**
   - Keep old auth working
   - Issue new tokens on next login
   - Migrate all users over time

## Production Considerations

### 1. Token Storage
- **Current**: localStorage (convenient but vulnerable to XSS)
- **Recommended**: HTTP-only cookies for refresh tokens
- **Alternative**: Secure storage with encryption

### 2. Token Cleanup
- Run cleanup job daily to remove expired tokens
- Clean up inactive sessions every 30 minutes
- Monitor token usage patterns

### 3. Security Monitoring
- Track refresh token usage
- Alert on unusual patterns (multiple IPs, rapid refreshes)
- Implement rate limiting on refresh endpoint
- Log all token refresh attempts

### 4. Performance
- Index MongoDB collections on `user_id`, `token_hash`, `expires_at`
- Cache active sessions
- Use connection pooling for database

## Troubleshooting

### Issue: Token refresh fails
**Solution:**
- Check refresh token exists in localStorage
- Verify token hasn't expired (7 days)
- Check MongoDB for revoked tokens
- Review backend logs for errors

### Issue: Infinite refresh loop
**Solution:**
- Verify refresh endpoint returns new access token
- Check token expiry times are correct
- Ensure refresh token is being updated in localStorage

### Issue: Sessions not showing
**Solution:**
- Verify session creation on login
- Check MongoDB sessions collection
- Ensure user_id matches correctly

## Summary

This module provides:
- ✅ Professional authentication flow
- ✅ Automatic token refresh
- ✅ Session management
- ✅ Multiple device support
- ✅ Force logout capability
- ✅ Activity tracking
- ✅ Security best practices
- ✅ Seamless user experience

Users can now work without interruption, with tokens automatically refreshing in the background.