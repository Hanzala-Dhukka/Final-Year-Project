# Module 6.4 — Password Reset & Account Recovery

## Overview

This module implements a complete password reset and account recovery system for CyberShield. Users can securely reset their passwords via email verification using time-limited tokens.

## Architecture

```
User Forgot Password
    ↓
Enter Email
    ↓
Generate Secure Token (15 min expiry)
    ↓
Send Email with Reset Link
    ↓
User Clicks Link
    ↓
Verify Token
    ↓
Create New Password
    ↓
Update Password Hash
    ↓
Invalidate All Sessions
    ↓
Login Successfully
```

## Implementation Summary

### Backend Components

#### 1. Reset Token Model (`models/reset_token_model.py`)

```python
{
  "_id": ObjectId,
  "user_id": "65abc123...",
  "token": "8Hd92ks92Kdk29dks...",
  "expires_at": "2026-07-09T12:15:00Z",
  "used": false,
  "created_at": "2026-07-09T12:00:00Z"
}
```

#### 2. Reset Token Repository (`repositories/reset_token_repository.py`)

**Methods:**
- `create_reset_token()` - Create new reset token
- `get_valid_token()` - Get valid (non-expired, non-used) token
- `mark_token_as_used()` - Mark token as used
- `invalidate_user_tokens()` - Invalidate all user tokens
- `cleanup_expired_tokens()` - Delete expired tokens

#### 3. Email Service (`services/email_service.py`)

**Features:**
- Send password reset emails
- Send welcome emails
- Configurable SMTP settings
- HTML email support

**Email Template:**
```
Subject: CyberShield - Password Reset Request

Hello {user_name},

You have requested to reset your password for your CyberShield account.

Click the link below to reset your password:
{reset_link}

This link will expire in 15 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
CyberShield Team
```

#### 4. Password Service (`services/password_service.py`)

**Methods:**
- `hash_password()` - Hash password using bcrypt
- `verify_password()` - Verify password against hash
- `validate_password_strength()` - Validate password requirements
- `is_password_common()` - Check against common passwords

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

#### 5. Token Service (`services/token_service.py`)

**Methods:**
- `generate_secure_token()` - Generate cryptographically secure token
- `create_password_reset_token()` - Create reset token for user
- `verify_reset_token()` - Verify token is valid
- `use_reset_token()` - Mark token as used
- `cleanup_expired_tokens()` - Clean up expired tokens

#### 6. Auth Routes (`routes/auth_routes.py`)

**New Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |

### Frontend Components

#### Forgot Password Page (`frontend/src/pages/ForgotPassword.jsx`)

**Features:**
- Email input field
- Send reset link button
- Success/error messages
- Link back to login

**UI:**
```
Forgot Password
Enter your email and we'll send you a reset link

Email: [____________]

[Send Reset Link]

Back to Login
```

#### Reset Password Page (`frontend/src/pages/ResetPassword.jsx`)

**Features:**
- New password input
- Confirm password input
- Password strength validation
- Token validation
- Success/error messages
- Auto-redirect to login

**UI:**
```
Reset Password
Create a new password for your account

New Password: [____________]
Confirm New Password: [____________]

[Reset Password]

Back to Login
```

## API Endpoints

### Forgot Password

**Request:**
```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists, a reset link has been sent"
}
```

**Security Note:** Always returns success to prevent user enumeration.

### Reset Password

**Request:**
```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "8Hd92ks92Kdk29dks...",
  "new_password": "Secure@123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
```json
{
  "detail": "Invalid or expired reset token"
}
```

```json
{
  "detail": "Password must be at least 8 characters long"
}
```

```json
{
  "detail": "Password is too common. Please choose a stronger password"
}
```

## Security Features

### 1. Token Security
- **Cryptographically Secure**: Uses `secrets.token_urlsafe(32)`
- **Short Expiration**: 15 minutes
- **One-Time Use**: Token marked as used after reset
- **Auto Cleanup**: Expired tokens automatically deleted

### 2. Password Security
- **Bcrypt Hashing**: Industry-standard password hashing
- **Strength Validation**: Enforces strong passwords
- **Common Password Check**: Blocks commonly used passwords
- **Session Invalidation**: All sessions revoked after reset

### 3. Anti-Enumeration
- **Generic Messages**: Same response for existing/non-existing emails
- **No User Leakage**: Doesn't reveal if email exists

### 4. Token Management
- **Invalidation**: Old tokens invalidated when new one requested
- **Single Active Token**: Only one valid token per user at a time
- **TTL Index**: MongoDB automatically deletes expired tokens

## Database Collections

### password_reset_tokens

```javascript
{
  "_id": ObjectId,
  "user_id": String,
  "token": String,
  "expires_at": DateTime,
  "used": Boolean,
  "created_at": DateTime,
  "used_at": DateTime (optional),
  "invalidated_at": DateTime (optional)
}
```

**Indexes:**
```javascript
{ "token": 1 } // Unique, for fast lookup
{ "user_id": 1 } // For invalidating user tokens
{ "expires_at": 1 } // TTL index for auto-cleanup
{ "used": 1 } // For filtering valid tokens
```

## Configuration

### Environment Variables

```env
# Email Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=cybershield@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
USE_CREDENTIALS=True
VALIDATE_CERTS=True

# Frontend URL (for reset link)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup

1. Enable 2-factor authentication
2. Generate app password
3. Use app password in `MAIL_PASSWORD`

## Password Reset Flow

### Step 1: User Requests Reset
```
1. User clicks "Forgot Password"
2. Enters email address
3. Clicks "Send Reset Link"
4. Frontend calls POST /api/v1/auth/forgot-password
```

### Step 2: Backend Processing
```
1. Find user by email
2. If user exists:
   - Invalidate old tokens
   - Generate secure token
   - Store token in MongoDB (15 min expiry)
   - Send email with reset link
3. Return generic success message
```

### Step 3: User Clicks Link
```
1. User receives email
2. Clicks reset link: http://localhost:3000/reset-password/{token}
3. Frontend loads ResetPassword page with token
4. User enters new password
5. Confirms password
6. Clicks "Reset Password"
```

### Step 4: Backend Validation
```
1. Verify token exists and is valid
2. Check token not expired
3. Check token not used
4. Validate password strength
5. Hash new password
6. Update user password_hash
7. Mark token as used
8. Invalidate all user sessions (security)
9. Return success
```

### Step 5: Login
```
1. User redirected to login page
2. User logs in with new password
3. Normal login flow continues
```

## Testing

### Test 1: Request Password Reset
```bash
curl -X POST "http://localhost:8000/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "message": "If an account exists, a reset link has been sent"
}
```

### Test 2: Check MongoDB
```bash
# Connect to MongoDB
mongosh

# Use database
use cybershield

# Find reset tokens
db.password_reset_tokens.find()
```

**Expected Document:**
```json
{
  "_id": ObjectId("..."),
  "user_id": "65abc123...",
  "token": "8Hd92ks92Kdk29dks...",
  "expires_at": ISODate("2026-07-09T12:15:00Z"),
  "used": false,
  "created_at": ISODate("2026-07-09T12:00:00Z")
}
```

### Test 3: Reset Password
```bash
curl -X POST "http://localhost:8000/api/v1/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "8Hd92ks92Kdk29dks...",
    "new_password": "Secure@123"
  }'
```

**Expected Response:**
```json
{
  "message": "Password updated successfully"
}
```

### Test 4: Login with New Password
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Secure@123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Test 5: Token Expiration
1. Request password reset
2. Wait 15+ minutes
3. Try to reset password with token
4. Expected: "Invalid or expired reset token"

### Test 6: Reuse Token
1. Request password reset
2. Reset password with token
3. Try to reset password again with same token
4. Expected: "Invalid or expired reset token"

## Frontend Testing

### Test 1: Forgot Password Page
1. Navigate to `/forgot-password`
2. Enter email address
3. Click "Send Reset Link"
4. Verify success message appears
5. Check email for reset link

### Test 2: Reset Password Page
1. Click reset link from email
2. Verify ResetPassword page loads
3. Enter new password
4. Confirm password
5. Click "Reset Password"
6. Verify success message
7. Verify redirect to login

### Test 3: Password Validation
1. Try password less than 8 characters
2. Expected: Error message
3. Try password without special character
4. Expected: Error message
5. Try password "password123"
6. Expected: "Password is too common"

### Test 4: Token Validation
1. Use invalid token
2. Expected: Error message
3. Use expired token (wait 15+ minutes)
4. Expected: Error message
5. Use same token twice
6. Expected: Error message on second use

### Test 5: Login After Reset
1. Reset password successfully
2. Login with new password
3. Expected: Login successful
4. Try old password
5. Expected: Login failed

## Security Considerations

### 1. Token Security
- Tokens are cryptographically secure
- Tokens expire after 15 minutes
- Tokens can only be used once
- Tokens are invalidated after use

### 2. Password Security
- Bcrypt hashing with salt
- Strong password requirements
- Common password detection
- Session invalidation after reset

### 3. Email Security
- SMTP with TLS/SSL
- No sensitive data in emails
- Time-limited links
- Single-use tokens

### 4. Anti-Enumeration
- Same response for existing/non-existing emails
- No user information leakage
- Generic error messages

## Troubleshooting

### Issue: Email not sent
**Solution:**
- Check email configuration in `.env`
- Verify SMTP credentials
- Check spam folder
- Review email service logs

### Issue: Token not working
**Solution:**
- Check token expiration (15 minutes)
- Verify token hasn't been used
- Check MongoDB for token document
- Ensure token format is correct

### Issue: Password not updating
**Solution:**
- Verify password meets requirements
- Check MongoDB user document
- Review backend logs
- Ensure token is valid

### Issue: User enumeration possible
**Solution:**
- Ensure generic messages are used
- Don't reveal if email exists
- Same response time for all requests

## Migration from Old System

### Before (No Password Reset)
```python
# Old approach
@app.post("/login")
def login():
    # Verify password
    # Return JWT
    # No password reset option
```

### After (With Password Reset)
```python
# New approach
@app.post("/forgot-password")
async def forgot_password():
    # Generate secure token
    # Store in MongoDB
    # Send email
    # Return generic message

@app.post("/reset-password")
async def reset_password():
    # Verify token
    # Validate password
    # Hash password
    # Update user
    # Invalidate sessions
```

## Summary

This module provides:
- ✅ Secure password reset via email
- ✅ Cryptographically secure tokens
- ✅ 15-minute token expiration
- ✅ One-time token usage
- ✅ Password strength validation
- ✅ Common password detection
- ✅ Session invalidation after reset
- ✅ Anti-user enumeration protection
- ✅ Frontend forgot password page
- ✅ Frontend reset password page
- ✅ Email service with SMTP support
- ✅ Automatic token cleanup

The password reset system provides a secure, user-friendly way for users to recover their accounts while maintaining strong security practices.