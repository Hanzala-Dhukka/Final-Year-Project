# Admin Dashboard & User Management - Module 5.10

## Overview

This module implements a comprehensive admin panel for the CyberShield platform, allowing administrators to monitor and manage users, view platform statistics, and track security activities.

## Implementation Summary

### Backend Components

#### 1. User Model Updates (`app/models/user_model.py`)
- Added `account_status` field to track user status (active, blocked, suspended)
- Maintains backward compatibility with existing user documents

#### 2. Admin Middleware (`app/dependencies/admin_auth.py`)
- `admin_required` dependency checks if user has admin role
- Returns 403 Forbidden for non-admin users
- Integrated with existing authentication system

#### 3. User Repository Enhancements (`app/repositories/user_repository.py`)
Added methods:
- `get_all_users(skip, limit)` - Paginated user listing
- `search_users(query)` - Search by name, email, or role
- `update_user_role(user_id, new_role)` - Change user role
- `update_user_status(user_id, status)` - Change account status
- `get_user_activity(user_id)` - Get user activity summary
- `count_users()` - Total user count
- `count_active_users()` - Active user count

#### 4. Admin Service Layer (`app/services/admin_service.py`)
Comprehensive service class with methods:
- `get_all_users()` - Get paginated users with sanitization
- `search_users()` - Search users with multiple criteria
- `change_user_role()` - Update role with audit logging
- `change_user_status()` - Update status with audit logging
- `delete_user()` - Delete user with audit log creation
- `get_user_activity()` - Get user activity from multiple collections
- `get_platform_statistics()` - Platform-wide statistics
- `get_security_monitoring()` - Security scanner statistics
- `get_recent_activities()` - Recent platform activities

#### 5. Audit Log Integration (`app/services/audit_service.py`)
Added helper functions:
- `log_role_change()` - Log role changes by admin
- `log_account_status_change()` - Log status changes by admin

#### 6. Admin Routes (`app/routes/admin_routes.py`)
Complete REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | Get all users (paginated) |
| GET | `/api/v1/admin/users/search?query={query}` | Search users |
| PUT | `/api/v1/admin/users/{id}/role` | Change user role |
| PUT | `/api/v1/admin/users/{id}/status` | Change user status |
| DELETE | `/api/v1/admin/users/{id}` | Delete user |
| GET | `/api/v1/admin/users/{id}/activity` | Get user activity |
| GET | `/api/v1/admin/statistics` | Platform statistics |
| GET | `/api/v1/admin/security-monitoring` | Security monitoring data |
| GET | `/api/v1/admin/activities` | Recent activities |
| GET | `/api/v1/admin/dashboard` | All dashboard data |

### Frontend Components

#### 1. API Functions (`src/api/api.js`)
Added admin API functions:
```javascript
adminGetAllUsers(skip, limit)
adminSearchUsers(query)
adminChangeUserRole(userId, role)
adminChangeUserStatus(userId, status)
adminDeleteUser(userId)
adminGetUserActivity(userId)
adminGetStatistics()
adminGetSecurityMonitoring()
adminGetRecentActivities(limit)
adminGetDashboard()
```

#### 2. Admin Protected Route (`src/routes/AdminProtectedRoute.jsx`)
- Checks for valid authentication token
- Verifies user has admin role
- Redirects non-admin users to dashboard
- Redirects unauthenticated users to login

#### 3. Admin Dashboard Page (`src/pages/AdminDashboard.jsx`)
Comprehensive dashboard with 5 tabs:

**Dashboard Tab:**
- Statistics cards (Total Users, Total Scans, Threats Found, Active Users)
- Recent activities feed

**Users Tab:**
- Search functionality (by name, email, role)
- User table with inline role/status editing
- View user activity
- Change user status (active/blocked/suspended)
- Delete user with confirmation

**Statistics Tab:**
- User statistics (total, active, inactive)
- Activity statistics (scans, quizzes, OWASP attempts)
- Security issues (critical, high)

**Security Monitoring Tab:**
- GitHub Scanner stats (scans, critical/high issues)
- Security Scanner stats (websites checked, critical alerts)
- OWASP Simulator stats (attempts, SQL injection, XSS)

**Activities Tab:**
- Recent platform activities with timestamps
- Module and action details
- Success/failure status indicators

**User Activity Tab:**
- Individual user activity breakdown
- Repository scans, security scans, quiz attempts, OWASP labs
- Total activities and last login info

#### 4. Router Configuration (`src/routes/AppRouter.jsx`)
- Admin route protected with `AdminProtectedRoute`
- Accessible at `/admin`

### Database Schema

#### Users Collection
```javascript
{
  "_id": ObjectId,
  "username": String,
  "full_name": String,
  "email": String,
  "password_hash": String,
  "role": String (admin/instructor/student),
  "account_status": String (active/blocked/suspended),
  "is_email_verified": Boolean,
  "is_active": Boolean,
  "xp": Number,
  "level": Number,
  "skill_level": String,
  "profile": Object,
  "preferences": Object,
  "notifications": Object,
  "created_at": DateTime,
  "updated_at": DateTime,
  "last_login": DateTime
}
```

### User Roles & Permissions

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Scan Repository | ✅ | ✅ | ✅ |
| OWASP Labs | ✅ | ✅ | ✅ |
| View Users | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| View Reports | Own | Class | All |
| Delete Users | ❌ | ❌ | ✅ |

### Audit Logging

All admin actions are logged to the `audit_logs` collection:

**Role Change:**
```javascript
{
  "user_id": "user_id",
  "username": "username",
  "action": "ROLE_CHANGED",
  "module": "ADMIN",
  "description": "Role changed from student to instructor by admin_user",
  "timestamp": "2026-07-09T00:00:00Z",
  "status": "SUCCESS"
}
```

**Status Change:**
```javascript
{
  "user_id": "user_id",
  "username": "username",
  "action": "ACCOUNT_STATUS_CHANGED",
  "module": "ADMIN",
  "description": "Account status changed from active to blocked by admin_user",
  "timestamp": "2026-07-09T00:00:00Z",
  "status": "SUCCESS"
}
```

**User Deletion:**
```javascript
{
  "user_id": "user_id",
  "username": "username",
  "action": "USER_DELETED",
  "module": "ADMIN",
  "description": "User account deleted by admin_user",
  "timestamp": "2026-07-09T00:00:00Z",
  "status": "SUCCESS"
}
```

## Testing

### Backend Tests (`backend/tests/test_admin_api.py`)

Test classes:
- `TestAdminAuthentication` - Admin access control
- `TestUserManagement` - CRUD operations on users
- `TestUserActivity` - User activity monitoring
- `TestStatistics` - Platform statistics endpoints
- `TestAuditLogs` - Audit log integration
- `TestPermissions` - Role-based access control

### Running Tests
```bash
cd Final-Year-Project/cybershield/backend
pytest tests/test_admin_api.py -v
```

## API Response Examples

### Get All Users
**Request:**
```bash
GET /api/v1/admin/users
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "total": 120,
  "users": [
    {
      "id": "65abc123...",
      "name": "Ali Ahmed",
      "email": "ali@test.com",
      "role": "student",
      "status": "active",
      "created_at": "2026-07-09T00:00:00Z",
      "last_login": "2026-07-09T00:00:00Z",
      "is_email_verified": true
    }
  ]
}
```

### Platform Statistics
**Request:**
```bash
GET /api/v1/admin/statistics
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "total_users": 500,
  "active_users": 430,
  "inactive_users": 70,
  "total_scans": 1500,
  "github_scans": 1000,
  "security_scans": 500,
  "quiz_attempts": 2500,
  "owasp_attempts": 3400,
  "total_activities": 7400,
  "critical_issues": 62,
  "high_issues": 120
}
```

### Security Monitoring
**Request:**
```bash
GET /api/v1/admin/security-monitoring
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "github_scanner": {
    "total_scans": 1000,
    "critical_issues": 42,
    "high_issues": 120
  },
  "security_scanner": {
    "websites_checked": 500,
    "critical_alerts": 20
  },
  "owasp_simulator": {
    "total_attempts": 3400,
    "sql_injection_attempts": 1000,
    "xss_attempts": 800
  }
}
```

## Security Considerations

1. **Authentication**: All admin endpoints require valid JWT token
2. **Authorization**: Middleware verifies admin role before allowing access
3. **Audit Logging**: All sensitive actions are logged with user, timestamp, and details
4. **Input Validation**: All inputs are validated and sanitized
5. **Error Handling**: Generic error messages to prevent information disclosure

## Deployment Checklist

- [x] Backend admin routes created
- [x] Admin middleware implemented
- [x] User model updated with new fields
- [x] Repository methods added
- [x] Service layer implemented
- [x] Audit logging integrated
- [x] Frontend dashboard created
- [x] API functions added
- [x] Admin protected route created
- [x] Router configuration updated
- [x] Backend tests written
- [ ] Frontend tested with real data
- [ ] Charts and visualizations added (optional enhancement)
- [ ] Production deployment

## Future Enhancements

1. **Charts & Visualizations**: Add Recharts or Chart.js for visual data representation
2. **Advanced Filtering**: Add date range filters, role filters, status filters
3. **Bulk Operations**: Bulk user role changes, bulk status updates
4. **Export Functionality**: Export users list, statistics to CSV/PDF
5. **Email Notifications**: Notify users when their role/status changes
6. **Real-time Updates**: WebSocket integration for live activity feed
7. **Advanced Analytics**: User growth charts, scan activity trends
8. **User Impersonation**: Admin can view platform as specific user

## Notes

- The admin dashboard is accessible at `/admin` route
- Only users with `role: "admin"` can access the dashboard
- All admin actions are logged for security and compliance
- The dashboard is fully responsive and works on mobile devices
- Statistics are calculated in real-time from database queries

## Troubleshooting

**Issue**: Admin dashboard shows "Access Denied"
**Solution**: Ensure user role is set to "admin" in the database

**Issue**: Statistics not loading
**Solution**: Check that MongoDB collections exist and have data

**Issue**: Audit logs not being created
**Solution**: Verify audit service is properly imported and called

## Support

For issues or questions, refer to the main project documentation or contact the development team.