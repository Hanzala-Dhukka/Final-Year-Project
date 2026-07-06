# Interactive Attack Labs - Phase 4 Module 4.2

## Overview
Successfully implemented an interactive penetration testing lab platform that provides realistic hacking scenarios with attack/defense modes, XP system, badges, and progress tracking.

## Architecture

### Learning Flow
```
Choose Lab
      ↓
Read Scenario (Story + Objective)
      ↓
Analyze Vulnerable Code
      ↓
Launch Attack (Enter Payload)
      ↓
Observe Server Response
      ↓
AI Explanation (Why it worked)
      ↓
Fix Vulnerability (Write Defense Code)
      ↓
Score + XP + Badge
```

## Backend Implementation

### 1. Schemas (`app/schemas/lab_schema.py`)
- `AttackLab` - Lab structure with story, objective, vulnerable code
- `LabAttempt` - Individual attack attempt
- `LabSession` - Lab session state management
- `LabSubmission` - Attack payload submission
- `DefenseSubmission` - Defense code submission
- `LabResult` - Attack/defense result with XP
- `UserProgress` - User achievements and stats
- `LabStats` - Overall platform statistics

### 2. Attack Labs Data (`app/data/attack_labs.py`)

**8 Labs Across 6 Categories:**

| Lab ID | Title | Category | Difficulty | XP | Badge |
|--------|-------|----------|------------|-----|-------|
| LAB001 | Login Bypass using SQL Injection | SQL Injection | Easy | 100 | SQL Injection Beginner |
| LAB002 | Data Extraction via UNION Attack | SQL Injection | Medium | 150 | SQL Injection Intermediate |
| LAB003 | Reflected XSS in Search | XSS | Easy | 100 | XSS Hunter |
| LAB004 | Stored XSS in Comments | XSS | Medium | 150 | XSS Expert |
| LAB005 | File Conversion Service | Command Injection | Medium | 150 | Command Injection Expert |
| LAB006 | CSRF Token Bypass | CSRF | Medium | 150 | CSRF Hunter |
| LAB007 | SSRF to Internal Network | SSRF | Hard | 200 | SSRF Expert |
| LAB008 | IDOR to Access Other Users' Data | IDOR | Hard | 200 | IDOR Master |

**Each Lab Includes:**
- Interactive story (realistic scenario)
- Clear objective
- Vulnerable code example
- Progressive hints (3 levels)
- Solution payload
- Server responses (wrong/correct/partial)
- Detailed explanation
- OWASP reference
- XP reward
- Badge reward

### 3. Lab Validator (`app/services/lab_validator.py`)

**Validators for Each Category:**

#### SQL Injection Validator
Checks for:
- `OR 1=1` conditions
- `UNION SELECT` statements
- SQL comments (`--`)
- Always-true conditions

**Lab-Specific Validation:**
- LAB001: Login bypass with `' OR 1=1 --`
- LAB002: UNION attack to extract data

#### XSS Validator
Checks for:
- `<script>` tags
- `<img onerror>` events
- `<svg onload>` events
- `alert()` functions

**Lab-Specific Validation:**
- LAB003: Script tag with alert()
- LAB004: Image onerror for cookie theft

#### Command Injection Validator
Checks for:
- Semicolons (`;`)
- Pipes (`|`)
- Ampersands (`&`)
- Backticks (`` ` ``)
- Command chaining

**Lab-Specific Validation:**
- LAB005: `; cat /etc/passwd`

#### CSRF Validator
Checks for:
- `<form>` tags
- `<input>` fields
- Auto-submit scripts
- POST method

**Lab-Specific Validation:**
- LAB006: Auto-submitting form to /transfer

#### SSRF Validator
Checks for:
- localhost/127.0.0.1
- Internal IP ranges (192.168.x.x)
- File:// protocol
- HTTP protocol

**Lab-Specific Validation:**
- LAB007: http://localhost:8080/admin

#### IDOR Validator
Checks for:
- user_id parameter changes
- ID parameter manipulation
- Sequential ID access

**Lab-Specific Validation:**
- LAB008: Changing user_id to access other users

### 4. Attack Lab Service (`app/services/attack_lab_service.py`)

**Features:**
- Lab session management
- Attack payload validation
- Defense code validation (reuses Module 4.1)
- XP system (50 XP for attack, 50 XP for defense)
- Badge awarding system
- Progress tracking
- Leaderboard

**Lab States:**
1. `start` - Initial state
2. `scenario` - Viewing scenario
3. `attack` - Launching attacks
4. `success` - Attack successful
5. `defense` - Writing defense code
6. `completed` - Lab complete

**Scoring System:**
- Attack Success: 50 XP
- Defense Success: 50 XP (if score >= 80)
- Perfect Lab: 100 XP total
- Badge awarded on completion

**Difficulty Levels:**
- **Easy**: 10 attempts, hints enabled
- **Medium**: 5 attempts, hints after 3 attempts
- **Hard**: 3 attempts, no hints

### 5. API Routes (`app/routers/lab_routes.py`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/labs/labs` | Get all labs |
| GET | `/api/v1/labs/labs/category/{category}` | Get labs by category |
| GET | `/api/v1/labs/lab/{lab_id}` | Get lab details |
| POST | `/api/v1/labs/lab/start` | Start lab session |
| POST | `/api/v1/labs/lab/attack` | Submit attack payload |
| POST | `/api/v1/labs/lab/defense` | Submit defense code |
| GET | `/api/v1/labs/lab/hint/{session_id}` | Get progressive hint |
| GET | `/api/v1/labs/progress/{user_id}` | Get user progress |
| GET | `/api/v1/labs/leaderboard` | Get leaderboard |
| GET | `/api/v1/labs/stats` | Get platform stats |
| GET | `/api/v1/labs/categories` | Get all categories |
| GET | `/api/v1/labs/health` | Health check |

### 6. Google Sheets Integration

**New Worksheet: `AttackLabs`**
Columns: Lab ID | User | Category | Difficulty | Score | Completed | Time (s)

## Frontend Implementation

### Page: `InteractiveLabs.jsx`

**Layout:**
```
+--------------------------------------+
🎯 Interactive Attack Labs
--------------------------------------+
[Categories] [Main Content Area]
+--------------------------------------+
```

**Features:**

#### 1. Category Sidebar (Left)
- List of all attack categories
- Filter labs by category
- Progress display (XP, Labs Completed, %)

#### 2. Lab Cards Grid
- Lab title and story
- Difficulty badge (color-coded)
- Category badge
- XP reward display
- "Start Lab" button

#### 3. Lab Interface
When a lab is started:

**Header:**
- Lab title
- Difficulty & category badges
- Exit button

**Scenario Card (Blue):**
- Story background
- Objective

**Vulnerable Code Viewer (Red):**
- Syntax-highlighted code
- Shows the vulnerability

**Attack Phase:**
- Payload input (dark theme)
- Launch Attack button
- Hint button (progressive)
- Attempts counter

**Result Display:**
- Server response (color-coded)
- XP earned
- Detailed explanation
- Modified query (if applicable)

**Defense Challenge:**
- Appears after successful attack
- Code editor for secure code
- Submit Defense button

**Lab Complete:**
- Celebration animation
- Total XP display
- Badge earned display

#### 4. Progress Tracking
- Total XP
- Labs completed (X/Y)
- Completion percentage
- Badges collection

## API Documentation

### Get All Labs
```json
GET /api/v1/labs/labs
Response: {
  "labs": [...],
  "total": 8
}
```

### Start Lab
```json
POST /api/v1/labs/lab/start?lab_id=LAB001&user_id=anonymous
Response: {
  "session_id": "LAB-ABC12345",
  "lab": {...},
  "session": {...}
}
```

### Submit Attack
```json
POST /api/v1/labs/lab/attack
Request: {
  "lab_id": "LAB001",
  "payload": "' OR 1=1 --",
  "user_id": "anonymous"
}
Response: {
  "success": true,
  "server_response": "Welcome Administrator - Access Granted",
  "points_earned": 100,
  "explanation": "The OR 1=1 condition...",
  "xp_earned": 100,
  "next_step": "defense",
  "modified_query": "SELECT * FROM users WHERE username='' OR 1=1 --",
  "attempts_remaining": 9,
  "attempts_used": 1
}
```

### Submit Defense
```json
POST /api/v1/labs/lab/defense
Request: {
  "lab_id": "LAB001",
  "secure_code": "cursor.execute(query, (username, password))",
  "user_id": "anonymous"
}
Response: {
  "success": true,
  "score": 100,
  "status": "Passed",
  "feedback": "✅ Excellent!...",
  "defense_xp": 50,
  "total_xp": 150,
  "lab_complete": true,
  "badge_earned": "SQL Injection Beginner",
  "next_step": "completed"
}
```

### Get Hint
```json
GET /api/v1/labs/lab/hint/LAB-ABC12345?attempt_number=2
Response: {
  "hint": "Think about SQL comments and always-true conditions.",
  "attempt_number": 2,
  "hints_remaining": 1
}
```

### Get Progress
```json
GET /api/v1/labs/progress/anonymous
Response: {
  "user_id": "anonymous",
  "total_xp": 250,
  "labs_completed": 2,
  "total_labs": 8,
  "badges": ["SQL Injection Beginner", "XSS Hunter"],
  "completion_percentage": 25.0,
  "category_progress": {}
}
```

## Scoring System

### XP Calculation
```
Attack Success: +50 XP
Defense Success: +50 XP (if score >= 80)
Total per lab: 100 XP (maximum)
```

### Points System
- **Easy Labs**: 100 points
- **Medium Labs**: 150 points
- **Hard Labs**: 200 points

### Badges
Badges are awarded upon lab completion:
- SQL Injection Beginner (LAB001)
- SQL Injection Intermediate (LAB002)
- XSS Hunter (LAB003)
- XSS Expert (LAB004)
- Command Injection Expert (LAB005)
- CSRF Hunter (LAB006)
- SSRF Expert (LAB007)
- IDOR Master (LAB008)

## Testing

### Test 1: SQL Injection Lab
```bash
# Start lab
curl -X POST "http://localhost:8000/api/v1/labs/lab/start?lab_id=LAB001&user_id=test_user"

# Submit attack
curl -X POST "http://localhost:8000/api/v1/labs/lab/attack" \
  -H "Content-Type: application/json" \
  -d '{
    "lab_id": "LAB001",
    "payload": "' OR 1=1 --",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "server_response": "Welcome Administrator - Access Granted",
  "points_earned": 100,
  "xp_earned": 100,
  "next_step": "defense"
}
```

### Test 2: XSS Lab
```bash
curl -X POST "http://localhost:8000/api/v1/labs/lab/attack" \
  -H "Content-Type: application/json" \
  -d '{
    "lab_id": "LAB003",
    "payload": "<script>alert('XSS')</script>",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "server_response": "<h1>Search Results for: <script>alert('XSS')</script></h1> - Alert executed!",
  "points_earned": 100,
  "xp_earned": 100
}
```

### Test 3: Command Injection Lab
```bash
curl -X POST "http://localhost:8000/api/v1/labs/lab/attack" \
  -H "Content-Type: application/json" \
  -d '{
    "lab_id": "LAB005",
    "payload": "file.pdf; cat /etc/passwd",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "server_response": "Conversion complete. File contents: root:x:0:0...",
  "points_earned": 150,
  "xp_earned": 150
}
```

## Features Implemented

✅ PART 1 - Backend Structure
✅ PART 2 - Google Sheets (AttackLabs worksheet)
✅ PART 3 - Attack Scenario Objects (8 labs)
✅ PART 4 - Interactive Story (realistic scenarios)
✅ PART 5 - Lab States (6 states)
✅ PART 6 - Simulated Server Response (color-coded)
✅ PART 7 - Vulnerable Code Viewer (syntax-highlighted)
✅ PART 8 - Multiple Difficulty Levels (Easy/Medium/Hard)
✅ PART 9 - Hint Engine (3 progressive levels)
✅ PART 10 - Attack Validator (pattern matching)
✅ PART 11 - AI Explanation (detailed explanations)
✅ PART 12 - Defense Challenge (reuses Module 4.1)
✅ PART 13 - Lab Completion (attack + defense required)
✅ PART 14 - XP System (50+50=100 XP per lab)
✅ PART 15 - Badges (8 unique badges)
✅ PART 16 - API Endpoints (12 endpoints)
✅ PART 17 - Swagger Testing (all documented)
✅ PART 18 - Frontend Page (complete UI)
✅ PART 19 - Lab Interface (scenario → attack → defense)
✅ PART 20 - Progress Dashboard (XP, badges, completion %)

## Usage

### 1. Access Interactive Labs
Navigate to `/interactive-labs` in the frontend

### 2. Browse Labs
- View all available labs
- Filter by category
- Check XP rewards and difficulty

### 3. Start Lab
- Click "Start Lab" on any lab card
- Read the scenario and objective
- Study the vulnerable code

### 4. Launch Attack
- Enter your payload in the editor
- Click "Launch Attack"
- Observe server response
- Read the explanation

### 5. Use Hints (if needed)
- Click "Hint" button
- Hints become more direct with each attempt
- Maximum 3 hints per lab

### 6. Fix Vulnerability
- After successful attack, defense challenge appears
- Write secure code to fix the vulnerability
- Submit defense code

### 7. Earn Rewards
- XP points for attack and defense
- Badge for lab completion
- Progress tracked on leaderboard

## Configuration

### Environment Variables
```env
# Already configured
GOOGLE_SHEETS_ID=your-sheets-id  # For lab tracking
```

### Adding New Labs
Edit `app/data/attack_labs.py`:

```python
ATTACK_LABS = {
    "SQL Injection": [
        {
            "lab_id": "LAB009",
            "title": "Your Lab Title",
            "difficulty": "Easy",
            "category": "SQL Injection",
            "story": "Your scenario story...",
            "objective": "Your objective...",
            "hint": "Your hint...",
            "solution": "Expected payload",
            "vulnerable_code": "...",
            "language": "python",
            "xp_reward": 100,
            "badge_reward": "Badge Name",
            "server_responses": {
                "wrong": "Failed message",
                "correct": "Success message",
                "partial": "Partial message"
            },
            "explanation": "Detailed explanation...",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ]
}
```

### Adding New Validators
Edit `app/services/lab_validator.py`:

```python
@staticmethod
def validate_your_category(payload: str, lab_id: str) -> Dict[str, Any]:
    # Check for patterns
    patterns = {
        "pattern_name": bool(re.search(r"regex", payload, re.IGNORECASE))
    }
    
    # Lab-specific validation
    if lab_id == "LABXXX":
        if patterns["pattern_name"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "Explanation..."
            }
    
    return {
        "success": False,
        "points": 0,
        "response_type": "wrong",
        "explanation": "Pattern not detected."
    }
```

## Next Steps

1. **Test the implementation:**
   ```bash
   # Start backend
   cd Final-Year-Project/cybershield/backend
   uvicorn app.main:app --reload --port 8000
   
   # Start frontend
   cd Final-Year-Project/cybershield/frontend
   npm start
   ```

2. **Access the page:**
   - Navigate to `/interactive-labs`
   - Or use Swagger docs at `/docs`

3. **Try sample labs:**
   - LAB001: SQL Injection Login Bypass
   - LAB003: XSS in Search
   - LAB005: Command Injection

## Notes

- Lab sessions stored in-memory (restart clears sessions)
- User progress persists in-memory
- Google Sheets integration optional (falls back to in-memory)
- Hints are progressive (subtle → direct → solution)
- Defense phase reuses Module 4.1 validators
- XP system encourages completion of both attack and defense
- Badges provide gamification

## Production Considerations

1. **Database:** Replace in-memory storage with PostgreSQL
2. **Authentication:** Add user authentication
3. **Session Management:** Implement proper session handling
4. **More Labs:** Add 10+ labs per category
5. **Achievements:** Implement achievement system
6. **Certificates:** Generate completion certificates
7. **Leaderboard:** Global and category-specific rankings
8. **Multiplayer:** Add competitive modes
9. **Timed Challenges:** Add time-based scoring
10. **Hints System:** Implement hint cost (XP penalty)