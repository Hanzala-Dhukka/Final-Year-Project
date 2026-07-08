# Module 6.6 — Unified Dashboard API

## Overview

This module implements a comprehensive dashboard that aggregates data from all CyberShield modules into a single, unified view. The dashboard provides users with a complete overview of their cybersecurity learning journey, progress, and achievements.

## Architecture

```
User Login
    ↓
Dashboard Request
    ↓
Aggregate Data from:
├── Profile Service
├── Security Score Service
├── Progress Repository
├── Lab Repository
├── Quiz Repository
├── GitHub Repository
├── Security Report Repository
├── OWASP Repository
├── Chat Repository
└── Challenge Repository
    ↓
Compile Dashboard Response
    ↓
Display to User
```

## Implementation Summary

### Backend Components

#### Dashboard Routes (`routes/dashboard_routes.py`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/{user_id}` | Get complete dashboard data |
| GET | `/api/v1/dashboard/{user_id}/quick-stats` | Get quick statistics for widgets |

### Dashboard Data Sources

The dashboard aggregates data from the following endpoints:

| Feature | Source Endpoint | Data Provided |
|---------|----------------|---------------|
| Profile | `/api/v1/profile` | User info, full name, statistics |
| Security Score | `/api/v1/profile/security-score` | Score, level, factors, recommendations |
| Security Scans | `/api/v1/github/history` | Scan history, vulnerabilities found |
| Threat Reports | `/api/v1/threat/reports` | Generated reports, severity levels |
| OWASP Labs | `/api/v1/labs/progress` | Completed labs, attempts, categories |
| Quiz | `/api/v1/quiz/statistics` | Total attempts, average score, best score |
| Glossary | `/api/v1/glossary/progress` | Terms learned, progress tracking |
| AI Chat | `/api/v1/copilot/history` | Chat sessions, message counts |
| Achievements | `/api/v1/progress/achievements` | Earned achievements, badges |
| Certificates | `/api/v1/progress/certificate` | Earned certificates |
| Daily Challenge | `/api/v1/challenges/today` | Today's challenge, completion status |
| OWASP Simulations | `/api/v1/owasp/attempts` | Simulation attempts, scores |

### Dashboard Response Structure

```json
{
  "user_id": "65abc123...",
  "profile": {
    "username": "hanzala",
    "email": "user@example.com",
    "role": "student",
    "full_name": "Hanzala Khan",
    "statistics": {
      "xp": 2500,
      "level": 5,
      "labs_completed": 20,
      "quizzes_completed": 15,
      "average_quiz_score": 85.5,
      "achievements": 8,
      "streak_days": 12
    }
  },
  "security_score": {
    "score": 85,
    "level": "Advanced",
    "factors": {
      "password_strength": 20,
      "labs_completed": 25,
      "security_learning": 20,
      "account_security": 20
    },
    "recommendations": [
      "Complete more security labs",
      "Try advanced labs like CSRF"
    ]
  },
  "scans": {
    "total": 15,
    "recent": [
      {
        "id": "65def123...",
        "repository": "my-project",
        "vulnerabilities": 5,
        "date": "2026-07-09T10:00:00Z"
      }
    ]
  },
  "threat_reports": {
    "total": 8,
    "recent": [
      {
        "id": "65ghi456...",
        "title": "SQL Injection Analysis",
        "severity": "high",
        "date": "2026-07-09T10:00:00Z"
      }
    ]
  },
  "labs": {
    "completed": 20,
    "total_attempts": 25,
    "recent": [
      {
        "id": "65jkl789...",
        "lab_name": "CSRF Lab",
        "category": "Web Security",
        "completed_at": "2026-07-09T10:00:00Z"
      }
    ]
  },
  "quizzes": {
    "total_attempts": 15,
    "average_score": 85.5,
    "best_score": 100,
    "recent": [
      {
        "id": "65mno012...",
        "quiz_name": "OWASP Top 10",
        "score": 90,
        "completed_at": "2026-07-09T10:00:00Z"
      }
    ]
  },
  "glossary": {
    "terms_learned": 45,
    "total_terms": 100,
    "recent_terms": []
  },
  "ai_chat": {
    "total_sessions": 12,
    "recent": [
      {
        "id": "65pqr345...",
        "topic": "SQL Injection",
        "messages_count": 15,
        "last_activity": "2026-07-09T10:00:00Z"
      }
    ]
  },
  "achievements": {
    "total": 8,
    "recent": [
      "First Lab Completed",
      "Quiz Master",
      "Security Expert"
    ]
  },
  "certificates": {
    "total": 2,
    "recent": [
      "Web Security Fundamentals",
      "Ethical Hacking Basics"
    ]
  },
  "daily_challenge": {
    "id": "65stu678...",
    "title": "Complete XSS Prevention Lab",
    "description": "Learn to prevent XSS attacks",
    "xp_reward": 100
  },
  "owasp_simulations": {
    "total_attempts": 30,
    "recent": [
      {
        "id": "65vwx901...",
        "simulation_type": "SQL Injection",
        "score": 85,
        "completed_at": "2026-07-09T10:00:00Z"
      }
    ]
  }
}
```

### Quick Stats Response

```json
{
  "xp": 2500,
  "level": 5,
  "labs_completed": 20,
  "quizzes_completed": 15,
  "scans_completed": 15,
  "achievements": 8,
  "streak_days": 12
}
```

## Frontend Dashboard

### Dashboard Page (`frontend/src/pages/Dashboard.jsx`)

**Features:**
- Welcome header with user name
- Quick stats grid (XP, Level, Labs, Achievements)
- Security score display with color coding
- Security scans section with recent scans
- OWASP labs section with completion status
- Quiz performance section with statistics
- Threat reports section with severity indicators
- Daily challenge banner
- Recent activity feed

**UI Components:**

1. **StatCard** - Displays individual statistics with icons
2. **ActivityItem** - Shows recent activity with timestamps
3. **ScoreColor** - Color-codes security score (green/blue/yellow/red)
4. **SeverityColor** - Color-codes threat severity

**Sections:**
1. **Welcome Header** - Personalized greeting
2. **Quick Stats Grid** - 4-column grid of key metrics
3. **Security Score** - Large score display with factors breakdown
4. **Scans & Labs** - Two-column grid showing recent activity
5. **Quizzes & Reports** - Two-column grid showing performance
6. **Daily Challenge** - Prominent banner with call-to-action
7. **Recent Activity** - Timeline of recent actions

## API Endpoints

### Get Complete Dashboard

**Request:**
```bash
GET /api/v1/dashboard/{user_id}
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "user_id": "65abc123...",
  "profile": { ... },
  "security_score": { ... },
  "scans": { ... },
  "threat_reports": { ... },
  "labs": { ... },
  "quizzes": { ... },
  "glossary": { ... },
  "ai_chat": { ... },
  "achievements": { ... },
  "certificates": { ... },
  "daily_challenge": { ... },
  "owasp_simulations": { ... }
}
```

### Get Quick Stats

**Request:**
```bash
GET /api/v1/dashboard/{user_id}/quick-stats
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "xp": 2500,
  "level": 5,
  "labs_completed": 20,
  "quizzes_completed": 15,
  "scans_completed": 15,
  "achievements": 8,
  "streak_days": 12
}
```

## Data Aggregation Logic

### Dashboard Service

The dashboard router aggregates data from multiple repositories:

1. **Profile Service** - User profile and settings
2. **Security Score Service** - Calculated security score
3. **Progress Repository** - XP, level, achievements, certificates
4. **Lab Repository** - Lab attempts and completions
5. **Quiz Repository** - Quiz attempts and scores
6. **GitHub Repository** - Scan history
7. **Security Report Repository** - Threat reports
8. **OWASP Repository** - Simulation attempts
9. **Chat Repository** - AI chat history
10. **Challenge Repository** - Daily challenges

### Data Formatting

Each data source is formatted for dashboard display:

- **Scans**: Repository name, vulnerability count, date
- **Labs**: Lab name, category, completion date
- **Quizzes**: Quiz name, score, completion date
- **Reports**: Title, severity level, date
- **Chat**: Topic, message count, last activity
- **OWASP**: Simulation type, score, completion date

## Security Considerations

### 1. Access Control
- **Authentication Required**: All dashboard endpoints require valid JWT
- **User Isolation**: Users can only access their own dashboard
- **Authorization Check**: Verifies user_id matches current user

### 2. Data Privacy
- **Sensitive Data**: Only non-sensitive data exposed
- **No Passwords**: Password hashes never returned
- **Limited History**: Only recent items returned (max 5-10)

### 3. Performance
- **Parallel Fetching**: Data fetched concurrently where possible
- **Limited Results**: Only recent items returned to reduce payload
- **Efficient Queries**: Uses indexed fields for fast lookups

## Configuration

### Environment Variables
No additional environment variables required.

### Dashboard Settings

```python
DASHBOARD_SETTINGS = {
    "recent_items_limit": 5,
    "max_scan_history": 10,
    "max_lab_attempts": 100,
    "max_quiz_attempts": 100,
    "max_chat_history": 10,
    "max_owasp_attempts": 100
}
```

## Testing

### Test 1: Get Complete Dashboard

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/65abc123..." \
  -H "Authorization: Bearer eyJ..."
```

**Expected Response:**
```json
{
  "user_id": "65abc123...",
  "profile": {
    "username": "hanzala",
    "email": "user@example.com",
    "statistics": {
      "xp": 2500,
      "level": 5
    }
  },
  "security_score": {
    "score": 85,
    "level": "Advanced"
  },
  "scans": {
    "total": 15,
    "recent": []
  },
  "labs": {
    "completed": 20,
    "recent": []
  }
}
```

### Test 2: Get Quick Stats

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/65abc123.../quick-stats" \
  -H "Authorization: Bearer eyJ..."
```

**Expected Response:**
```json
{
  "xp": 2500,
  "level": 5,
  "labs_completed": 20,
  "quizzes_completed": 15,
  "scans_completed": 15,
  "achievements": 8,
  "streak_days": 12
}
```

### Test 3: Access Denied

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/DIFFERENT_USER_ID" \
  -H "Authorization: Bearer eyJ..."
```

**Expected Response:**
```json
{
  "detail": "Access denied"
}
```

## Frontend Testing

### Test 1: Load Dashboard
1. Login to the application
2. Navigate to Dashboard page
3. Verify all sections load correctly
4. Check quick stats display
5. Verify security score shows

### Test 2: Verify Data Display
1. Check profile information displays
2. Verify scan history shows (if any)
3. Check lab completions display
4. Verify quiz statistics show
5. Check threat reports display
6. Verify daily challenge shows

### Test 3: Navigation
1. Click "View All" links
2. Verify navigation to respective pages
3. Check all links work correctly

### Test 4: Responsive Design
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)
4. Verify grid layouts adjust correctly

### Test 5: Empty States
1. Test with new user (no data)
2. Verify empty state messages show
3. Check "No scans yet" messages
4. Verify "No labs completed" messages

## Performance Optimization

### 1. Parallel Data Fetching
```python
# Fetch multiple data sources concurrently
profile_data = asyncio.create_task(profile_service.get_user_profile(user_id))
security_score = asyncio.create_task(security_score_service.get_security_score(user_id))
progress = asyncio.create_task(progress_repository.get_progress_by_user(user_id))

# Wait for all to complete
results = await asyncio.gather(profile_data, security_score, progress)
```

### 2. Limited Results
```python
# Only fetch recent items for dashboard
scan_history = await github_repository.get_scans_by_user(user_id, limit=10)
lab_attempts = await lab_repository.get_lab_attempts_by_user(user_id, limit=100)
```

### 3. Efficient Formatting
```python
# Format only what's needed for display
recent_scans = _format_scans(scan_history[:5])
```

## Troubleshooting

### Issue: Dashboard loads slowly
**Solution:**
- Implement caching for frequently accessed data
- Reduce limit on history items
- Use parallel fetching
- Consider pagination for large datasets

### Issue: Some sections not loading
**Solution:**
- Check individual endpoint health
- Verify repository methods work
- Review error logs
- Test each data source independently

### Issue: Data not updating
**Solution:**
- Clear browser cache
- Verify API responses are fresh
- Check database queries return latest data
- Implement cache invalidation

## Summary

This module provides:
- ✅ Unified dashboard API
- ✅ Aggregates data from all modules
- ✅ Complete user overview
- ✅ Quick stats endpoint
- ✅ Security score integration
- ✅ Recent activity tracking
- ✅ Daily challenge display
- ✅ Frontend dashboard page
- ✅ Responsive design
- ✅ Performance optimized
- ✅ Secure access control

The dashboard serves as the central hub for users to view their complete cybersecurity learning journey, progress, and achievements in one comprehensive view.