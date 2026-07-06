# OWASP Defense Mode - Phase 4 Module 4.1

## Overview
Successfully implemented an interactive OWASP Defense Mode that transforms the CyberShield platform into a complete Cyber Range. Users can now learn to secure their code against common vulnerabilities through hands-on practice.

## Architecture

### Learning Flow
```
Choose OWASP Category
        ↓
Choose Mode (Attack/Defense)
        ↓
Interactive Lab
        ↓
Write Defense Code
        ↓
AI Feedback
        ↓
Score
        ↓
Progress Tracking
```

## Backend Implementation

### 1. Schemas (`app/schemas/defense_schema.py`)
- `DefenseScenario` - Scenario structure with vulnerable code
- `DefenseSubmission` - User's code submission
- `DefenseResult` - Validation result with score and feedback
- `DefenseSession` - Session record
- `DefenseHistory` - User's complete history

### 2. Defense Scenarios (`app/data/defense_scenarios.py`)

**Categories Available:**
- SQL Injection (2 scenarios)
- XSS (2 scenarios)
- Command Injection (2 scenarios)
- Path Traversal (2 scenarios)

**Each Scenario Includes:**
- Vulnerable code example
- Secure code example
- Hints (3 levels)
- Key terms to look for
- OWASP reference
- Best practices

**Example Scenarios:**

**SQL Injection - User Login Query:**
```python
# Vulnerable
query = f"SELECT * FROM users WHERE email='{email}' AND password='{password}'"
cursor.execute(query)

# Secure (user should write)
query = "SELECT * FROM users WHERE email=? AND password=?"
cursor.execute(query, (email, password))
```

**XSS - User Profile Display:**
```python
# Vulnerable
html = f"<div>Welcome, {username}!</div>"

# Secure (user should write)
safe_username = html.escape(username)
html = f"<div>Welcome, {safe_username}!</div>"
```

### 3. Defense Validator (`app/services/defense_validator.py`)

**Validators for Each Category:**

#### SQL Injection Validator
Checks for:
- Parameterized queries (`execute(query, (params,))`)
- Question mark placeholders (?)
- Prepared statements
- No string concatenation
- ORM usage
- Input validation

**Scoring:**
- Parameterized queries: +80 points
- Prepared statements: +70 points
- ORM usage: +10 points
- Input validation: +10 points
- String concatenation: -30 points

#### XSS Validator
Checks for:
- `html.escape()` usage
- DOMPurify sanitization
- CSP headers
- No `innerHTML` or `dangerouslySetInnerHTML`
- Template auto-escaping

**Scoring:**
- html.escape(): +40 points
- DOMPurify: +30 points
- CSP headers: +20 points
- Sanitization: +20 points
- innerHTML: -20 points

#### Command Injection Validator
Checks for:
- `subprocess.run()` or `subprocess.call()`
- `shell=False`
- Argument list (not string)
- No `os.system()`
- Input validation
- `shlex.quote`

**Scoring:**
- subprocess with shell=False: +60 points
- Argument list: +20 points
- os.system(): -50 points
- Input validation: +10 points
- shlex usage: +10 points

#### Path Traversal Validator
Checks for:
- `pathlib` usage
- `resolve()` for canonical path
- `basename()` for filename
- `startswith()` validation
- No string concatenation

**Scoring:**
- pathlib: +30 points
- resolve(): +25 points
- basename(): +20 points
- startswith(): +25 points
- String concatenation: -20 points

### 4. AI Feedback Engine (`app/services/ai_feedback.py`)

**Features:**
- AI-enhanced feedback using Gemini (if available)
- Rule-based fallback feedback
- Bonus points for best practices
- OWASP explanations
- Progressive hints system

**Feedback Includes:**
- Detailed feedback on code
- Specific recommendations
- Best practices list
- Secure code example
- OWASP reference
- Bonus points calculation

### 5. API Routes (`app/routers/defense_routes.py`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/owasp/categories` | Get all OWASP categories |
| GET | `/api/v1/owasp/scenario/{category}` | Get random scenario |
| GET | `/api/v1/owasp/scenario/id/{scenario_id}` | Get specific scenario |
| POST | `/api/v1/owasp/submit` | Submit defense code |
| GET | `/api/v1/owasp/history/{user_id}` | Get user history |
| GET | `/api/v1/owasp/session/{session_id}` | Get specific session |
| GET | `/api/v1/owasp/leaderboard` | Get top users |
| GET | `/api/v1/owasp/achievements/{user_id}` | Get achievements |
| GET | `/api/v1/owasp/hint/{scenario_id}` | Get hint |
| GET | `/api/v1/owasp/explain/{category}` | Get OWASP explanation |
| GET | `/api/v1/owasp/stats` | Get overall stats |
| GET | `/api/v1/owasp/health` | Health check |

### 6. Google Sheets Integration

**New Worksheet: `DefenseSessions`**
Columns: Session ID | User | Category | Score | Status | Time (s)

## Frontend Implementation

### Page: `OWASPDefenseMode.jsx`

**Layout:**
```
+--------------------------------------+
🛡️ OWASP Defense Mode
--------------------------------------+
[Categories] [Main Content Area]
+--------------------------------------+
```

**Features:**

#### 1. Category Sidebar (Left)
- List of all OWASP categories
- Click to load random scenario
- Visual indicator for selected category
- History button

#### 2. Scenario Display
- **Vulnerable Code Card** (Red theme)
  - Shows vulnerable code
  - Language badge
  - Difficulty level
  
- **Task Card** (Blue theme)
  - Clear instructions
  - What to secure

#### 3. Code Editor
- Dark theme textarea
- Monospace font
- Large editing area (64 lines)
- Placeholder text

#### 4. Action Buttons
- **Submit Defense** - Submit code for validation
- **Hint** - Get progressive hints (3 levels)
- **Next Scenario** - Load new scenario

#### 5. Result Card
- **Score Display** (Large, color-coded)
  - Green: 80-100 (Passed)
  - Yellow: 50-79 (Partial)
  - Red: 0-49 (Failed)
  
- **Status Badge**
  - Passed (Green)
  - Partial (Yellow)
  - Failed (Red)

- **Feedback Section** (Blue theme)
  - Detailed feedback
  - What was done well
  - What needs improvement

- **Recommendation** (Green theme)
  - Specific actionable advice

- **OWASP Reference** (Purple theme)
  - OWASP category reference
  - Link to documentation

- **Best Practices** (List)
  - Industry standards
  - Security guidelines

- **Secure Code Example** (Dark theme)
  - Syntax-highlighted
  - Copy-paste ready

#### 6. History Panel
- Shows all past sessions
- Score and status for each
- Date stamp
- Toggle visibility

## API Documentation

### Get Categories
```json
GET /api/v1/owasp/categories
Response: {
  "categories": [
    "SQL Injection",
    "XSS",
    "Command Injection",
    "Path Traversal"
  ]
}
```

### Get Scenario
```json
GET /api/v1/owasp/scenario/SQL Injection
Response: {
  "scenario_id": "SQLI_001",
  "category": "SQL Injection",
  "title": "User Login Query",
  "vulnerable_code": "...",
  "language": "python",
  "difficulty": "Easy",
  "hints": [...],
  "secure_example": "...",
  "owasp": "A03:2021 – Injection",
  "best_practices": [...]
}
```

### Submit Defense
```json
POST /api/v1/owasp/submit
Request: {
  "scenario_id": "SQLI_001",
  "category": "SQL Injection",
  "user_code": "cursor.execute(query, (email, password))",
  "user_id": "anonymous"
}
Response: {
  "scenario_id": "SQLI_001",
  "category": "SQL Injection",
  "score": 100,
  "status": "Passed",
  "feedback": "✅ Excellent! You're using parameterized queries...",
  "recommendation": "Excellent work! Continue using...",
  "owasp_reference": "A03:2021 – Injection",
  "best_practices": [...],
  "secure_code_example": "...",
  "timestamp": "2024-01-01T00:00:00"
}
```

### Get Hint
```json
GET /api/v1/owasp/hint/SQLI_001?hint_level=1
Response: {
  "scenario_id": "SQLI_001",
  "hint_level": 1,
  "hint": "Use parameterized queries"
}
```

### Get History
```json
GET /api/v1/owasp/history/anonymous
Response: {
  "user_id": "anonymous",
  "sessions": [...],
  "total_score": 250,
  "categories_completed": ["SQL Injection", "XSS"],
  "achievements": []
}
```

## Scoring System

### Score Calculation
```
Base Score (from validator): 0-100
+ Best Practice Bonus: +10 (if score >= 80)
+ Multiple Practices Bonus: +10 (if >= 3 best practices)
= Total Score: 0-100
```

### Status Thresholds
- **Passed**: 80-100 points
- **Partial**: 50-79 points
- **Failed**: 0-49 points

### Example Scores

**SQL Injection - Perfect Solution:**
```python
cursor.execute(query, (email, password))
```
Score: 100 (Passed)

**XSS - Good Solution:**
```python
safe_username = html.escape(username)
html = f"<div>Welcome, {safe_username}!</div>"
```
Score: 95 (Passed)

**Command Injection - Perfect Solution:**
```python
subprocess.run(["convert", filename, "output.pdf"], shell=False, check=True)
```
Score: 100 (Passed)

## Testing

### Test 1: SQL Injection Defense
```bash
curl -X POST http://localhost:8000/api/v1/owasp/submit \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "SQLI_001",
    "category": "SQL Injection",
    "user_code": "cursor.execute(query, (email, password))",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "score": 100,
  "status": "Passed",
  "feedback": "✅ Excellent! You're using parameterized queries...",
  "recommendation": "Excellent work! Continue using...",
  "owasp_reference": "A03:2021 – Injection",
  "best_practices": [
    "Using parameterized queries with placeholders",
    "Using ORM framework",
    "Input validation implemented"
  ],
  "secure_code_example": "...",
  "timestamp": "2024-01-01T00:00:00"
}
```

### Test 2: XSS Defense
```bash
curl -X POST http://localhost:8000/api/v1/owasp/submit \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "XSS_001",
    "category": "XSS",
    "user_code": "import html\nsafe_username = html.escape(username)",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "score": 95,
  "status": "Passed",
  "feedback": "✅ Good! Using html.escape()...",
  ...
}
```

### Test 3: Command Injection Defense
```bash
curl -X POST http://localhost:8000/api/v1/owasp/submit \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "CMD_001",
    "category": "Command Injection",
    "user_code": "subprocess.run([\"convert\", filename, \"output.pdf\"], shell=False, check=True)",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "score": 100,
  "status": "Passed",
  "feedback": "✅ Excellent! Using subprocess with shell=False...",
  ...
}
```

## Features Implemented

✅ PART 1 - Folder Structure
✅ PART 2 - Google Sheets (DefenseSessions worksheet)
✅ PART 3 - Defense Scenarios (8 scenarios across 4 categories)
✅ PART 4 - User Submission (code editor)
✅ PART 5 - Defense Validator (pattern matching)
✅ PART 6 - AI Feedback (Gemini + rule-based)
✅ PART 7 - Score Calculation (0-100 with bonuses)
✅ PART 8 - Save Session (Google Sheets + in-memory)
✅ PART 9 - API (11 endpoints)
✅ PART 10 - Swagger Testing (all endpoints documented)
✅ PART 11 - Frontend Page (complete UI)
✅ PART 12 - Code Editor (dark theme, monospace)
✅ PART 13 - Result Card (score, status, feedback)
✅ PART 14 - History Page (session tracking)

## Usage

### 1. Access Defense Mode
Navigate to `/owasp-defense` in the frontend

### 2. Select Category
Click on an OWASP category from the left sidebar

### 3. Review Vulnerable Code
Study the vulnerable code example provided

### 4. Write Defense Code
Enter your secure code in the editor

### 5. Submit
Click "Submit Defense" to validate your code

### 6. Review Results
- View your score
- Read feedback
- Check best practices
- Study secure example

### 7. Use Hints (if needed)
Click "Hint" button for progressive hints

### 8. Track Progress
View your history to see improvement over time

## Configuration

### Environment Variables
```env
# Already configured
GEMINI_API_KEY=your-gemini-api-key  # For AI feedback
GOOGLE_SHEETS_ID=your-sheets-id      # For session tracking
```

### Adding New Scenarios
Edit `app/data/defense_scenarios.py`:

```python
DEFENSE_SCENARIOS = {
    "SQL Injection": [
        {
            "scenario_id": "SQLI_003",
            "category": "SQL Injection",
            "title": "Your Scenario Title",
            "vulnerable_code": "...",
            "language": "python",
            "difficulty": "Easy",
            "hints": ["Hint 1", "Hint 2", "Hint 3"],
            "key_terms": ["execute", "?", "parameterized"],
            "secure_example": "...",
            "owasp": "A03:2021 – Injection",
            "best_practices": ["Practice 1", "Practice 2"]
        }
    ]
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
   - Navigate to `/owasp-defense`
   - Or use Swagger docs at `/docs`

3. **Try sample scenarios:**
   - SQL Injection defense
   - XSS prevention
   - Command Injection protection
   - Path Traversal prevention

## Notes

- Defense sessions stored in-memory (restart clears history)
- Google Sheets integration optional (falls back to in-memory)
- AI feedback uses Gemini if available, otherwise rule-based
- Hints are progressive (subtle → direct)
- Scoring is automated based on code patterns
- All scenarios include secure code examples for learning

## Production Considerations

1. **Database:** Replace in-memory storage with PostgreSQL
2. **Authentication:** Add user authentication
3. **Code Execution:** Implement sandboxed code execution for validation
4. **More Scenarios:** Add 10+ scenarios per category
5. **Achievements:** Implement gamification system
6. **Certificates:** Generate completion certificates
7. **Progress Tracking:** Detailed analytics per user
8. **Leaderboard:** Global and category-specific rankings