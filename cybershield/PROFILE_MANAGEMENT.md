# Module 6.5 — User Profile, Settings & Security Dashboard

## Overview

This module implements a comprehensive user profile management system with security scoring, settings management, and activity tracking. Users can manage their profiles, customize preferences, track login history, and monitor their security health.

## Architecture

```
User Login
    ↓
Dashboard
    ↓
Profile Management
    ↓
├── Profile Information
├── User Settings
├── Password Change
├── Security Score
└── Login Activity
```

## Implementation Summary

### Backend Components

#### 1. Profile Model (`models/profile_model.py`)

**Collections:**

**user_profiles:**
```javascript
{
  "_id": ObjectId,
  "user_id": "65abc123...",
  "full_name": "Hanzala Khan",
  "profile_image": null,
  "bio": "Cybersecurity enthusiast",
  "location": "Mumbai, India",
  "skills": ["Python", "Security Testing"],
  "social_links": {},
  "created_at": "2026-07-09T10:00:00Z",
  "updated_at": "2026-07-09T10:00:00Z"
}
```

**user_settings:**
```javascript
{
  "_id": ObjectId,
  "user_id": "65abc123...",
  "theme": "light",
  "language": "English",
  "email_notifications": true,
  "security_alerts": true,
  "lab_notifications": true,
  "achievement_notifications": true,
  "created_at": "2026-07-09T10:00:00Z",
  "updated_at": "2026-07-09T10:00:00Z"
}
```

**login_history:**
```javascript
{
  "_id": ObjectId,
  "user_id": "65abc123...",
  "ip_address": "192.168.1.10",
  "device": "Chrome Windows",
  "location": "Mumbai, India",
  "login_time": "2026-07-09T10:00:00Z",
  "status": "success",
  "user_agent": "Mozilla/5.0..."
}
```

**security_score:**
```javascript
{
  "_id": ObjectId,
  "user_id": "65abc123...",
  "score": 85,
  "level": "Advanced",
  "factors": {
    "password_strength": 20,
    "labs_completed": 25,
    "security_learning": 20,
    "account_security": 20
  },
  "recommendations": ["Complete more labs", "Enable 2FA"],
  "calculated_at": "2026-07-09T10:00:00Z",
  "updated_at": "2026-07-09T10:00:00Z"
}
```

#### 2. Profile Repository (`repositories/profile_repository.py`)

**Methods:**
- `get_profile()` - Get user profile
- `create_profile()` - Create new profile
- `update_profile()` - Update existing profile
- `get_settings()` - Get user settings
- `update_settings()` - Update user settings
- `add_login_history()` - Record login activity
- `get_login_history()` - Get login history
- `get_security_score()` - Get security score
- `create_or_update_security_score()` - Update security score

#### 3. Profile Service (`services/profile_service.py`)

**Methods:**
- `get_user_profile()` - Get complete profile with statistics
- `update_profile()` - Update profile information
- `get_user_settings()` - Get user preferences
- `update_user_settings()` - Update user preferences
- `change_password()` - Change user password securely
- `record_login_activity()` - Track login events
- `get_login_history()` - Retrieve login history

#### 4. Security Score Service (`services/security_score_service.py`)

**Methods:**
- `calculate_security_score()` - Calculate comprehensive security score
- `get_security_score()` - Get existing security score

**Scoring Factors:**
1. **Password Security (0-20 points)**
   - Password hashing: 15 points
   - Password strength: 5 points

2. **Labs Completed (0-30 points)**
   - 2 points per completed lab
   - Maximum 30 points

3. **Security Learning (0-25 points)**
   - Based on quiz performance
   - 80%+ avg: 25 points
   - 60%+ avg: 20 points
   - 40%+ avg: 15 points
   - <40% avg: 10 points

4. **Account Security (0-25 points)**
   - Account age: 5 points
   - Email verification: 10 points
   - Active status: 10 points

**Levels:**
- 80-100: Expert
- 60-79: Advanced
- 40-59: Intermediate
- 0-39: Beginner

#### 5. Profile Routes (`routes/profile_routes.py`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profile` | Get user profile with statistics |
| PUT | `/api/v1/profile/update` | Update profile information |
| GET | `/api/v1/profile/settings` | Get user settings |
| PUT | `/api/v1/profile/settings` | Update user settings |
| POST | `/api/v1/profile/change-password` | Change password |
| GET | `/api/v1/profile/activity` | Get login activity |
| GET | `/api/v1/profile/security-score` | Get security score |
| POST | `/api/v1/profile/security-score/calculate` | Recalculate security score |

### Frontend Components

#### Profile Page (`frontend/src/pages/Profile.jsx`)

**Features:**
- Profile header with avatar
- Security score display with color coding
- Learning statistics (XP, Level, Labs, Achievements)
- Tabbed interface for different sections
- Profile editing
- Settings management
- Password change
- Login history display

**Tabs:**
1. **Profile Tab** - Edit profile information
2. **Settings Tab** - Manage preferences
3. **Security Tab** - Change password
4. **Activity Tab** - View login history

**UI Elements:**
- Profile avatar with initials
- Security score with color-coded display
- Statistics cards
- Tabbed navigation
- Forms for updates
- Login history list

## API Endpoints

### Get Profile

**Request:**
```bash
GET /api/v1/profile
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "user_id": "65abc123...",
  "username": "hanzala",
  "email": "user@example.com",
  "role": "student",
  "profile": {
    "full_name": "Hanzala Khan",
    "bio": "Cybersecurity enthusiast",
    "location": "Mumbai, India",
    "skills": ["Python", "Security Testing"]
  },
  "settings": {
    "theme": "light",
    "language": "English",
    "email_notifications": true,
    "security_alerts": true
  },
  "statistics": {
    "xp": 2500,
    "level": 5,
    "labs_completed": 20,
    "quizzes_completed": 15,
    "average_quiz_score": 85.5,
    "achievements": 8,
    "streak_days": 12
  }
}
```

### Update Profile

**Request:**
```bash
PUT /api/v1/profile/update
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "full_name": "Hanzala Khan",
  "bio": "Cybersecurity enthusiast",
  "location": "Mumbai, India",
  "skills": ["Python", "Security Testing", "Networking"]
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

### Change Password

**Request:**
```bash
POST /api/v1/profile/change-password
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "old_password": "OldPass123!",
  "new_password": "NewStrong@456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response:**
```json
{
  "detail": "Invalid old password"
}
```

### Get Settings

**Request:**
```bash
GET /api/v1/profile/settings
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "theme": "light",
  "language": "English",
  "email_notifications": true,
  "security_alerts": true,
  "lab_notifications": true,
  "achievement_notifications": true
}
```

### Update Settings

**Request:**
```bash
PUT /api/v1/profile/settings
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "theme": "dark",
  "email_notifications": false
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

### Get Activity

**Request:**
```bash
GET /api/v1/profile/activity
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "total_logins": 25,
  "recent_logins": [
    {
      "id": "65def456...",
      "device": "Chrome Windows",
      "ip_address": "192.168.1.10",
      "location": "Mumbai, India",
      "login_time": "2026-07-09T10:00:00Z",
      "status": "success"
    }
  ],
  "devices_used": ["Chrome Windows", "Mobile Safari"],
  "locations": ["Mumbai, India", "Delhi, India"],
  "last_login": "2026-07-09T10:00:00Z"
}
```

### Get Security Score

**Request:**
```bash
GET /api/v1/profile/security-score
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "score": 85,
  "level": "Advanced",
  "factors": {
    "password_strength": 20,
    "labs_completed": 25,
    "security_learning": 20,
    "account_security": 20
  },
  "recommendations": [
    "Complete more security labs to improve your score",
    "Try advanced labs like CSRF and SQL Injection"
  ],
  "calculated_at": "2026-07-09T10:00:00Z"
}
```

## Security Features

### 1. Password Change Security
- **Old Password Verification**: Requires current password
- **Password Strength Validation**: Enforces strong passwords
- **Common Password Check**: Blocks weak passwords
- **Session Invalidation**: All sessions revoked after password change

### 2. Data Privacy
- **Authentication Required**: All endpoints require valid JWT
- **User Isolation**: Users can only access their own data
- **Secure Storage**: Passwords hashed with bcrypt

### 3. Activity Tracking
- **Login History**: Tracks all login attempts
- **Device Tracking**: Records device information
- **IP Logging**: Logs IP addresses
- **Status Monitoring**: Tracks success/failure/suspicious

## Database Collections

### user_profiles
```javascript
{
  "_id": ObjectId,
  "user_id": String (unique),
  "full_name": String,
  "profile_image": String (optional),
  "bio": String (optional),
  "location": String (optional),
  "skills": [String],
  "social_links": Object,
  "created_at": DateTime,
  "updated_at": DateTime
}
```

**Indexes:**
```javascript
{ "user_id": 1 } // Unique
```

### user_settings
```javascript
{
  "_id": ObjectId,
  "user_id": String (unique),
  "theme": String,
  "language": String,
  "email_notifications": Boolean,
  "security_alerts": Boolean,
  "lab_notifications": Boolean,
  "achievement_notifications": Boolean,
  "created_at": DateTime,
  "updated_at": DateTime
}
```

**Indexes:**
```javascript
{ "user_id": 1 } // Unique
```

### login_history
```javascript
{
  "_id": ObjectId,
  "user_id": String,
  "ip_address": String,
  "device": String,
  "location": String (optional),
  "login_time": DateTime,
  "status": String,
  "user_agent": String (optional)
}
```

**Indexes:**
```javascript
{ "user_id": 1 }
{ "login_time": -1 }
```

### security_score
```javascript
{
  "_id": ObjectId,
  "user_id": String (unique),
  "score": Number,
  "level": String,
  "factors": Object,
  "recommendations": [String],
  "calculated_at": DateTime,
  "updated_at": DateTime
}
```

**Indexes:**
```javascript
{ "user_id": 1 } // Unique
```

## Configuration

### Environment Variables
No additional environment variables required for this module.

### Default Settings
```python
DEFAULT_SETTINGS = {
    "theme": "light",
    "language": "English",
    "email_notifications": True,
    "security_alerts": True,
    "lab_notifications": True,
    "achievement_notifications": True
}
```

## Testing

### Test 1: Get Profile
```bash
curl -X GET "http://localhost:8000/api/v1/profile" \
  -H "Authorization: Bearer eyJ..."
```

**Expected Response:**
```json
{
  "user_id": "65abc123...",
  "username": "hanzala",
  "email": "user@example.com",
  "role": "student",
  "profile": {
    "full_name": "Hanzala Khan",
    "bio": "Cybersecurity enthusiast"
  },
  "statistics": {
    "xp": 2500,
    "level": 5,
    "labs_completed": 20
  }
}
```

### Test 2: Update Profile
```bash
curl -X PUT "http://localhost:8000/api/v1/profile/update" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Hanzala Khan",
    "bio": "Cybersecurity enthusiast",
    "location": "Mumbai"
  }'
```

**Expected Response:**
```json
{
  "message": "Profile updated successfully"
}
```

### Test 3: Change Password (Wrong Password)
```bash
curl -X POST "http://localhost:8000/api/v1/profile/change-password" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "WrongPass",
    "new_password": "NewStrong@456"
  }'
```

**Expected Response:**
```json
{
  "detail": "Invalid old password"
}
```

### Test 4: Change Password (Success)
```bash
curl -X POST "http://localhost:8000/api/v1/profile/change-password" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "CorrectOldPass",
    "new_password": "NewStrong@456"
  }'
```

**Expected Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Test 5: Login Activity
1. Login to the application
2. Check MongoDB login_history collection
3. Expected: New document created with login details

### Test 6: Security Score
1. Complete a lab
2. Call `/api/v1/profile/security-score/calculate`
3. Check score increases
4. Verify recommendations update

## Frontend Testing

### Test 1: View Profile
1. Navigate to Profile page
2. Verify profile information displays
3. Check statistics show correctly
4. Verify security score displays

### Test 2: Update Profile
1. Go to Profile tab
2. Update full name, bio, location
3. Click "Update Profile"
4. Verify success message
5. Refresh page and verify changes persist

### Test 3: Change Settings
1. Go to Settings tab
2. Change theme to dark
3. Toggle notifications
4. Click "Update Settings"
5. Verify changes apply

### Test 4: Change Password
1. Go to Security tab
2. Enter old password
3. Enter new strong password
4. Click "Change Password"
5. Verify success message
6. Try logging in with new password
7. Verify old password no longer works

### Test 5: View Activity
1. Go to Activity tab
2. Verify login history displays
3. Check device information shows
4. Verify timestamps are correct

### Test 6: Security Score
1. View security score on profile page
2. Verify score displays with color
3. Check recommendations show
4. Complete a lab
5. Recalculate score
6. Verify score updates

## MongoDB Verification

### Connect to MongoDB
```bash
mongosh
use cybershield
```

### Check Collections
```javascript
// View profiles
db.user_profiles.find()

// View settings
db.user_settings.find()

// View login history
db.login_history.find().sort({login_time: -1}).limit(10)

// View security scores
db.security_score.find()
```

### Expected Documents

**user_profiles:**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "65abc123...",
  "full_name": "Hanzala Khan",
  "bio": "Cybersecurity enthusiast",
  "location": "Mumbai, India",
  "skills": ["Python", "Security Testing"],
  "created_at": ISODate("2026-07-09T10:00:00Z"),
  "updated_at": ISODate("2026-07-09T10:00:00Z")
}
```

**login_history:**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "65abc123...",
  "ip_address": "192.168.1.10",
  "device": "Chrome Windows",
  "login_time": ISODate("2026-07-09T10:00:00Z"),
  "status": "success"
}
```

**security_score:**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "65abc123...",
  "score": 85,
  "level": "Advanced",
  "factors": {
    "password_strength": 20,
    "labs_completed": 25,
    "security_learning": 20,
    "account_security": 20
  },
  "recommendations": ["Complete more labs"]
}
```

## Security Considerations

### 1. Password Security
- Old password verification required
- Strong password enforcement
- Session invalidation after change
- Bcrypt hashing

### 2. Data Protection
- Authentication required for all endpoints
- User data isolation
- No sensitive data in responses

### 3. Activity Tracking
- IP address logging
- Device tracking
- Login status monitoring
- Suspicious activity detection

## Troubleshooting

### Issue: Profile not found
**Solution:**
- Profile is created on first access
- Check user_id matches
- Verify MongoDB connection

### Issue: Security score not calculating
**Solution:**
- Ensure user has completed some activities
- Check lab and quiz repositories work
- Review error logs

### Issue: Login history not recording
**Solution:**
- Verify login endpoint calls record function
- Check MongoDB login_history collection
- Review activity service logs

### Issue: Settings not persisting
**Solution:**
- Check user_settings collection
- Verify update endpoint works
- Clear browser cache

## Summary

This module provides:
- ✅ User profile management
- ✅ Profile update functionality
- ✅ Password change with security
- ✅ User preferences/settings
- ✅ Login activity tracking
- ✅ Security score calculation
- ✅ Learning statistics
- ✅ Frontend profile dashboard
- ✅ Tabbed interface
- ✅ MongoDB storage for all data

The profile management system provides users with complete control over their account information, preferences, and security settings while maintaining comprehensive tracking and security monitoring.