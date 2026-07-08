# Progress Tracking, Achievements & Certificates Module

## Overview

This module implements a comprehensive progress tracking system for the CyberShield platform, including XP/Level system, achievements, learning analytics, certificates, and personalized learning roadmaps.

## Architecture

```
Complete Lab
    │
    ▼
Progress Tracker
    │
┌───────────┼────────────┐
▼           ▼            ▼
Achievement   Analytics   Skill Level
    │           │            │
    └───────────┼────────────┘
                ▼
         MongoDB Database
                │
                ▼
      Certificate Generator
                │
                ▼
           React Dashboard
```

## Module Breakdown

### 4.5.1 Progress Tracker
- Tracks user progress across all activities
- Records lab completions, scores, and attempts
- Integrates with MongoDB for persistent storage

### 4.5.2 XP & Level System

| Action | XP |
|--------|-----|
| Daily Challenge | 100 |
| Attack Lab | 75 |
| Defense Lab | 75 |
| Quiz | 25 |
| AI Practice | 20 |
| Perfect Score Bonus | +25 |
| 7-Day Streak | +100 |
| 30-Day Streak | +500 |

### 4.5.3 Level System

| Level | XP Required |
|-------|-------------|
| 1 | 0 XP |
| 2 | 250 XP |
| 3 | 600 XP |
| 4 | 1,000 XP |
| 5 | 1,500 XP |
| ... | ... |
| 20 | 10,000 XP |

### 4.5.4 Skill Levels

| Level | Requirements |
|-------|-------------|
| Beginner | Default |
| Intermediate | Accuracy > 40%, Labs > 5 |
| Advanced | Accuracy > 60%, Labs > 10 |
| Expert | Accuracy > 80%, Labs > 20 |
| Security Professional | Accuracy > 90%, Labs > 40, XP > 5,000 |

### 4.5.5 Achievement Engine

| Badge | Requirement |
|-------|-------------|
| First Blood | Complete first lab |
| SQL Hunter | Finish all SQL labs |
| XSS Defender | Complete all XSS defense labs |
| Injection Master | Complete all injection modules |
| Daily Warrior | 7-day streak |
| Cyber Explorer | Complete 20 labs |
| Perfect Defender | 100% on 10 labs |
| AI Learner | Use AI tutor 20 times |
| Quiz Champion | Score 100% on 10 quizzes |
| Security Professional | Reach Expert skill level |

### 4.5.6 Analytics Engine

Calculates:
- Average Score
- Completed Labs
- Weakest Category
- Strongest Category
- Average Attempts
- Total XP
- Current Streak
- Longest Streak
- Completed Challenges

### 4.5.7 PDF Certificate

Eligibility Requirements:
- Complete 80% of labs
- Average score > 75%

Certificate includes:
- User name
- Course name
- Level achieved
- Labs completed
- Average score
- Certificate ID
- Issue date

### 4.5.8 Learning Roadmap

Personalized learning path generated using Gemini AI:
- Prioritizes weak topics
- Follows logical progression
- Builds on completed topics

## MongoDB Collections

### user_progress Collection
| Field | Type | Description |
|-------|------|-------------|
| user_id | string | Unique user identifier |
| xp | int | Total XP |
| level | int | Current level |
| skill | string | Skill level (Beginner, Intermediate, etc.) |
| completed_labs | int | Number of completed labs |
| average_score | float | Average score |
| last_login | string | Last login timestamp |

### achievements Collection
| Field | Type | Description |
|-------|------|-------------|
| user_id | string | User identifier |
| badge | string | Badge name |
| date | string | Date earned |
| created_at | string | Record creation timestamp |

### certificates Collection
| Field | Type | Description |
|-------|------|-------------|
| user_id | string | User identifier |
| certificate_id | string | Unique certificate ID |
| course | string | Course name |
| date | string | Date issued |
| file_path | string | Path to PDF file |
| created_at | string | Record creation timestamp |

### lab_attempts Collection
| Field | Type | Description |
|-------|------|-------------|
| user_id | string | User identifier |
| lab_id | string | Lab ID |
| category | string | Category name |
| score | int | Score achieved |
| attempts | int | Number of attempts |
| success | bool | Whether lab was completed |
| timestamp | string | Attempt timestamp |

## API Endpoints

### GET `/api/v1/progress/dashboard/{user_id}`
Returns complete dashboard data including XP, level, skill, analytics, achievements, and certificate eligibility.

### POST `/api/v1/progress/xp`
Add XP for a user action.
- `user_id`: User identifier
- `action`: Action type (daily_challenge, attack_lab, defense_lab, quiz, ai_practice)
- `score`: Score achieved (0-100)
- `perfect_score`: Whether the user got a perfect score
- `streak_days`: Current streak days

### GET `/api/v1/progress/achievements/{user_id}`
Returns user achievements.

### GET `/api/v1/progress/analytics/{user_id}`
Returns learning analytics.

### GET `/api/v1/progress/certificate/{user_id}`
Check eligibility and generate certificate.

### GET `/api/v1/progress/roadmap/{user_id}`
Returns personalized learning roadmap.

### GET `/api/v1/progress/leaderboard`
Returns XP leaderboard.

## Frontend Components

### LearningDashboard.jsx
- User profile with XP and level
- Progress overview
- Category mastery
- Achievements display
- Learning roadmap preview
- Certificate download

### RoadmapPage.jsx
- Completed topics
- Weak areas
- Recommended learning path
- Start next topic button

## Installation

```bash
pip install reportlab pymongo motor
```

## Usage

```python
# Add XP
result = ProgressService.add_xp("user123", "attack_lab", score=100, perfect_score=True)

# Check achievements
achievements = AchievementService.check_achievements("user123", "lab_completed", "SQL Injection", 100)

# Get analytics
analytics = AnalyticsService.get_learning_analytics("user123")

# Generate certificate
certificate = CertificateService.generate_certificate("user123", "John Doe")

# Get learning roadmap
roadmap = await RoadmapService.generate_roadmap("user123")
```

## Testing

```bash
pytest tests/test_progress_tracking.py -v
```

## MongoDB Setup

The module uses the following environment variables from `.env`:
- `MONGO_URI` - MongoDB connection string (default: mongodb://localhost:27017/)
- `DATABASE_NAME` - Database name (default: cybershield)