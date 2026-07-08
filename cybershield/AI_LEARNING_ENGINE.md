# AI Learning & Explanation Engine
## Module 4.3 - CyberShield Final Year Project

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Endpoints](#api-endpoints)
5. [Frontend Component](#frontend-component)
6. [Database Schema](#database-schema)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Configuration](#configuration)

---

## 🎯 Overview

The AI Learning & Explanation Engine is a personalized, AI-powered tutoring system that provides adaptive learning experiences for cybersecurity students. It uses Google's Gemini AI to generate contextual explanations, hints, and practice questions based on the user's skill level and performance.

### Key Capabilities

- **Personalized Explanations**: AI-generated explanations tailored to Beginner, Intermediate, and Advanced skill levels
- **Progressive Hints**: 3-level hint system that becomes progressively more direct
- **Practice Questions**: AI-generated multiple-choice questions for knowledge reinforcement
- **Adaptive Learning**: Dynamic difficulty adjustment based on user performance
- **Learning Analytics**: Comprehensive progress tracking and skill level progression
- **Google Sheets Integration**: Persistent learning history storage

---

## 🏗️ Architecture

### Backend Structure

```
app/
├── services/
│   ├── ai_learning_service.py          # Main service orchestrator
│   ├── explanation_builder.py          # AI explanation generation
│   ├── prompt_builder.py               # Prompt template management
│   ├── hint_engine.py                  # Progressive hint generation
│   ├── recommendation_engine.py        # Learning recommendations
│   └── adaptive_learning.py            # Adaptive difficulty engine
├── schemas/
│   └── ai_learning_schema.py           # Pydantic models
├── routers/
│   └── ai_learning_routes.py           # API endpoints
└── prompts/
    ├── explanation_prompt.txt          # Explanation prompt template
    ├── hint_prompt.txt                 # Hint prompt template
    └── practice_prompt.txt             # Practice question template
```

### Data Flow

```
User Attempt
    ↓
Analyze Attempt
    ↓
Build AI Context (skill level, topic, payload)
    ↓
Gemini AI Processing
    ↓
Personalized Explanation
    ↓
Hints (if incorrect)
    ↓
Practice Question
    ↓
Learning Recommendation
    ↓
Update Progress & Skill Level
```

---

## ✨ Features

### 4.3.1 AI Prompt Builder

Dynamic prompt generation based on:
- User skill level (Beginner/Intermediate/Advanced)
- Topic and payload
- Previous attempts and hints
- Learning context

**Example Prompt Structure:**
```
You are an expert cybersecurity tutor specializing in {topic}.

STUDENT INFORMATION:
- Skill Level: {skill_level}
- Topic: {topic}
- Payload/Attempt: {payload}
- Result: {result}

Provide a personalized explanation in JSON format...
```

### 4.3.2 Dynamic Explanation Generator

Generates skill-level-appropriate explanations:

**Beginner:**
> "SQL Injection happens when a website places user input directly into a SQL query. Think of it as someone changing a question before the database answers it."

**Intermediate:**
> "The payload bypasses authentication because OR 1=1 always evaluates to TRUE. The WHERE clause is modified to return all records."

**Advanced:**
> "The authentication query becomes vulnerable because the WHERE clause is altered. Parameterized queries prevent this by separating executable SQL from user-controlled data."

### 4.3.3 Personalized Hint Engine

Progressive 3-level hint system:

- **Hint 1 (Subtle)**: Conceptual nudge
  - "Think about how SQL queries are structured. What characters have special meaning in SQL?"
  
- **Hint 2 (Moderate)**: Technical guidance
  - "Consider how you can modify the query logic using SQL operators like OR or AND."
  
- **Hint 3 (Direct)**: Nearly reveals answer
  - "Try using ' OR '1'='1' -- to bypass authentication. The OR condition always evaluates to TRUE."

### 4.3.4 Learning Recommendations

AI-generated recommendations based on performance:
- Next 3 topics to learn
- Specific focus areas
- Practice exercises
- Learning path progression

### 4.3.5 Adaptive Difficulty

Automatic difficulty adjustment:

**Skill Level Thresholds:**
- **Beginner**: Starting level
- **Intermediate**: 70% accuracy, 70 avg score, 5 labs completed
- **Advanced**: 90% accuracy, 85 avg score, 10 labs completed

**Difficulty Adjustment:**
- Accuracy ≥ 90% → Increase difficulty
- Accuracy ≤ 30% → Decrease difficulty
- Otherwise → Maintain current level

### 4.3.6 AI Follow-up Questions

Contextual follow-up topics:
- "Would you like to learn about Blind SQL Injection?"
- "Would you like to learn about UNION Injection?"
- "Would you like to learn about Parameterized Queries?"

### 4.3.7 Learning History

Comprehensive tracking:
- Total attempts per topic
- Correct/incorrect ratio
- Weakness identification
- Skill level progression
- Last updated timestamp

### 4.3.8 AI Practice Generator

Dynamic practice questions:
- Multiple choice questions
- Code fix challenges
- Payload writing exercises
- Difficulty-appropriate content

---

## 🔌 API Endpoints

### Base URL
```
/api/v1/ai-learning
```

### 1. Generate Explanation

**Endpoint:** `POST /explain`

**Request:**
```json
{
  "topic": "SQL Injection",
  "payload": "' OR '1'='1' --",
  "result": "correct",
  "skill_level": "Beginner",
  "user_id": "user_123",
  "attempt_number": 1,
  "previous_hints": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "🤖 CyberShield AI Tutor\n\nSQL Injection happens when...",
    "personalized_feedback": "🎉 Excellent work! You got it right!",
    "recommendations": [
      "Practice basic SQL queries",
      "Learn about authentication mechanisms"
    ],
    "next_topics": ["XSS Basics", "CSRF Fundamentals"],
    "skill_level": "Beginner",
    "confidence_score": 0.85,
    "hint_available": true,
    "follow_up_questions": [
      "Would you like to learn about XSS?"
    ],
    "key_concept": "SQL Query Manipulation",
    "why_it_worked": "The OR condition always evaluates to TRUE",
    "prevention": "Use parameterized queries",
    "real_world_example": "Like changing a question before the database answers"
  }
}
```

### 2. Get Hint

**Endpoint:** `POST /hint`

**Request:**
```json
{
  "topic": "SQL Injection",
  "payload": "' OR '1'='1' --",
  "hint_number": 1,
  "skill_level": "Beginner",
  "user_id": "user_123",
  "previous_hints": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hint": "💡 Hint from CyberShield AI Tutor\n\nThink about how SQL queries are structured...",
    "hint_level": 1,
    "next_hint_available": true,
    "topic": "SQL Injection",
    "what_to_consider": "Special characters in SQL"
  }
}
```

### 3. Generate Practice Question

**Endpoint:** `POST /practice`

**Request:**
```json
{
  "topic": "SQL Injection",
  "skill_level": "Beginner",
  "user_id": "user_123",
  "question_type": "multiple_choice"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is SQL Injection?",
    "question_type": "multiple_choice",
    "options": [
      "A) A way to inject SQL code into queries",
      "B) A database optimization technique",
      "C) A method to secure SQL queries",
      "D) A way to backup databases"
    ],
    "correct_answer": "A",
    "explanation": "SQL Injection is a vulnerability where attackers inject malicious SQL code...",
    "difficulty": "Beginner",
    "topic": "SQL Injection"
  }
}
```

### 4. Update Progress

**Endpoint:** `POST /progress`

**Request:**
```json
{
  "user_id": "user_123",
  "topic": "SQL Injection",
  "result": "correct",
  "score": 85.0,
  "attempts": 1,
  "lab_id": "lab_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saved": true,
    "progress": {
      "user_id": "user_123",
      "skill_level": "Beginner",
      "completed_topics": 1,
      "average_score": 85.0,
      "total_attempts": 1,
      "correct_attempts": 1,
      "accuracy": 1.0,
      "weakest_area": null,
      "strongest_area": "SQL Injection",
      "learning_path": ["Web Security Fundamentals", "SQL Injection Basics", ...],
      "last_updated": "2026-01-15T10:30:00"
    }
  }
}
```

### 5. Get User Progress

**Endpoint:** `GET /progress/{user_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "skill_level": "Intermediate",
    "completed_topics": 5,
    "average_score": 78.5,
    "total_attempts": 20,
    "correct_attempts": 16,
    "accuracy": 0.8,
    "weakest_area": "CSRF",
    "strongest_area": "SQL Injection",
    "learning_path": ["Advanced SQL Injection", "Blind SQL Injection", ...],
    "last_updated": "2026-01-15T10:30:00"
  }
}
```

### 6. Get Learning History

**Endpoint:** `GET /history/{user_id}?topic={topic}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "topic": "SQL Injection",
    "history": [
      {
        "result": "correct",
        "score": 85.0,
        "attempts": 1,
        "timestamp": "2026-01-15T10:30:00"
      }
    ]
  }
}
```

### 7. Get Adaptive Difficulty

**Endpoint:** `POST /adaptive-difficulty`

**Request:**
```json
{
  "user_id": "user_123",
  "topic": "SQL Injection",
  "current_difficulty": "Easy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommended_difficulty": "Medium",
    "reason": "Great performance! Ready for medium difficulty.",
    "suggested_labs": ["SQL Injection - Medium Lab 1", "SQL Injection - Medium Lab 2"],
    "hint_level": "moderate"
  }
}
```

### 8. Get Learning Path

**Endpoint:** `GET /learning-path/{user_id}?current_topic=Web Security`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "skill_level": "Intermediate",
    "learning_path": [
      "Advanced SQL Injection",
      "Blind SQL Injection",
      "DOM-based XSS",
      "Stored XSS",
      "CSRF Tokens"
    ],
    "current_topic": "Web Security"
  }
}
```

### 9. Get Weak Areas

**Endpoint:** `GET /weak-areas/{user_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "weakest_area": "CSRF",
    "strongest_area": "SQL Injection",
    "accuracy": 0.8,
    "recommendation": "Focus on CSRF to improve your skills"
  }
}
```

### 10. Get Skill Level

**Endpoint:** `GET /skill-level/{user_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "skill_level": "Intermediate",
    "completed_topics": 5,
    "average_score": 78.5,
    "total_attempts": 20,
    "next_level_requirements": {
      "next_level": "Advanced",
      "requirements": {
        "accuracy": "90%",
        "average_score": "85/100",
        "labs_completed": 10
      },
      "tip": "Complete 10 labs with 90% accuracy to reach Advanced level"
    }
  }
}
```

---

## 🎨 Frontend Component

### AITutorPanel Component

A comprehensive React component with 4 tabs:

1. **Explanation Tab**: Shows AI-generated explanation with feedback
2. **Hint Tab**: Progressive hint system
3. **Practice Tab**: AI-generated practice questions
4. **Progress Tab**: Learning statistics and progress

### Usage

```jsx
import AITutorPanel from './components/AITutorPanel';

<AITutorPanel
  topic="SQL Injection"
  payload="' OR '1'='1' --"
  result="correct"
  skillLevel="Beginner"
  user_id="user_123"
  lab_id="lab_001"
  attemptNumber={1}
  onComplete={() => console.log('Learning session complete')}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `topic` | string | Yes | Security topic (e.g., "SQL Injection") |
| `payload` | string | Yes | User's attack payload |
| `result` | string | Yes | "correct" or "incorrect" |
| `skillLevel` | string | Yes | "Beginner", "Intermediate", or "Advanced" |
| `user_id` | string | No | User identifier (default: "anonymous") |
| `lab_id` | string | No | Lab identifier |
| `attemptNumber` | number | No | Attempt number (default: 1) |
| `onComplete` | function | No | Callback when learning session completes |

---

## 🗄️ Database Schema

### Google Sheets: LearningHistory Worksheet

| Column | Type | Description |
|--------|------|-------------|
| User | string | User identifier |
| Topic | string | Topic name |
| Attempts | int | Total attempts |
| Correct | int | Correct attempts |
| Weakness | string | Optional weakness area |
| Skill Level | string | Current skill level |
| Last Updated | datetime | Last update timestamp |

### In-Memory Storage

**Learning History:**
```python
{
  "user_id_topic": {
    "user_id": "user_123",
    "topic": "SQL Injection",
    "attempts": 5,
    "correct": 3,
    "weakness": None,
    "skill_level": "Beginner",
    "last_score": 85.0,
    "last_updated": "2026-01-15T10:30:00",
    "history": [...]
  }
}
```

**User Progress:**
```python
{
  "user_id": {
    "user_id": "user_123",
    "skill_level": "Beginner",
    "completed_topics": 3,
    "average_score": 78.5,
    "total_attempts": 15,
    "correct_attempts": 12,
    "topics": {
      "SQL Injection": {
        "attempts": 5,
        "correct": 3,
        "total_score": 425.0
      }
    }
  }
}
```

---

## 💻 Usage Examples

### Example 1: Basic Explanation Request

```python
import requests

response = requests.post("http://localhost:8000/api/v1/ai-learning/explain", json={
    "topic": "SQL Injection",
    "payload": "' OR '1'='1' --",
    "result": "correct",
    "skill_level": "Beginner",
    "user_id": "student_001"
})

data = response.json()
print(data['data']['explanation'])
```

### Example 2: Getting Progressive Hints

```python
hints = []
for i in range(1, 4):
    response = requests.post("http://localhost:8000/api/v1/ai-learning/hint", json={
        "topic": "XSS",
        "payload": "<script>alert('test')</script>",
        "hint_number": i,
        "skill_level": "Intermediate",
        "user_id": "student_001",
        "previous_hints": hints
    })
    
    hint_data = response.json()['data']
    hints.append(hint_data['hint'])
    print(f"Hint {i}: {hint_data['hint']}")
```

### Example 3: Tracking Progress

```python
# Update progress after each attempt
requests.post("http://localhost:8000/api/v1/ai-learning/progress", json={
    "user_id": "student_001",
    "topic": "CSRF",
    "result": "correct",
    "score": 90.0,
    "attempts": 1
})

# Get overall progress
progress = requests.get("http://localhost:8000/api/v1/ai-learning/progress/student_001")
print(f"Skill Level: {progress.json()['data']['skill_level']}")
print(f"Average Score: {progress.json()['data']['average_score']}")
```

---

## 🧪 Testing

### Running Tests

```bash
# Navigate to backend directory
cd Final-Year-Project/cybershield/backend

# Run all tests
pytest tests/test_ai_learning.py -v

# Run specific test class
pytest tests/test_ai_learning.py::TestAIExplanation -v

# Run with coverage
pytest tests/test_ai_learning.py --cov=app.services.ai_learning --cov-report=html
```

### Test Coverage

- ✅ Explanation generation (correct/incorrect attempts)
- ✅ Progressive hint system (3 levels)
- ✅ Practice question generation
- ✅ Progress tracking and retrieval
- ✅ Learning history management
- ✅ Adaptive difficulty recommendations
- ✅ Learning path generation
- ✅ Weak area identification
- ✅ Skill level progression logic

---

## ⚙️ Configuration

### Environment Variables

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash

# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_CREDS_PATH=credentials.json

# Application Configuration
APP_NAME=CyberShield
APP_ENV=development
```

### Skill Level Thresholds

Configured in `adaptive_learning.py`:

```python
skill_thresholds = {
    "Beginner": {"accuracy": 0.0, "avg_score": 0.0, "labs_completed": 0},
    "Intermediate": {"accuracy": 0.70, "avg_score": 70.0, "labs_completed": 5},
    "Advanced": {"accuracy": 0.90, "avg_score": 85.0, "labs_completed": 10}
}
```

### Hint Progression

- **Hint 1**: Conceptual nudge (subtle)
- **Hint 2**: Technical guidance (moderate)
- **Hint 3**: Direct answer (explicit)

---

## 🔄 Integration with Existing Modules

### Interactive Labs Integration

```jsx
// In InteractiveLabs.jsx
import AITutorPanel from '../components/AITutorPanel';

const InteractiveLabs = () => {
  const [labResult, setLabResult] = useState(null);
  
  const handleLabSubmit = async (payload) => {
    const result = await submitLabAttempt(payload);
    setLabResult({
      topic: result.topic,
      payload: payload,
      result: result.success ? 'correct' : 'incorrect',
      skillLevel: user.skill_level
    });
  };
  
  return (
    <div>
      <LabComponent onSubmit={handleLabSubmit} />
      {labResult && (
        <AITutorPanel {...labResult} user_id={user.id} />
      )}
    </div>
  );
};
```

---

## 📊 Performance Metrics

### Response Times (with Gemini AI)

- Explanation Generation: ~2-3 seconds
- Hint Generation: ~1-2 seconds
- Practice Question: ~2-3 seconds
- Progress Update: <100ms

### Fallback Mode

When Gemini AI is unavailable:
- Rule-based explanations
- Pre-defined hints
- Static practice questions
- No AI processing delay

---

## 🚀 Future Enhancements

1. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
2. **User Authentication**: Integrate with existing auth system
3. **Analytics Dashboard**: Visual learning progress charts
4. **Social Features**: Leaderboards and achievements
5. **Mobile App**: React Native mobile application
6. **Offline Mode**: Local storage with sync
7. **Advanced AI Models**: GPT-4, Claude integration options
8. **Multilingual Support**: Multi-language explanations

---

## 📝 Notes

- All AI responses include provider and model information
- Fallback mode ensures functionality without Gemini API
- Google Sheets integration is optional (graceful degradation)
- Skill levels are automatically updated based on performance
- Learning history is persisted across sessions

---

## 🤝 Contributing

When extending the AI Learning Engine:

1. Add new prompt templates in `app/prompts/`
2. Update schemas in `app/schemas/ai_learning_schema.py`
3. Add service functions in appropriate service files
4. Register new endpoints in `app/routers/ai_learning_routes.py`
5. Update tests in `tests/test_ai_learning.py`
6. Document in this file

---

## 📄 License

Part of CyberShield Final Year Project

---

**Last Updated:** 2026-01-15
**Version:** 1.0.0
**Module:** 4.3 - AI Learning & Explanation Engine