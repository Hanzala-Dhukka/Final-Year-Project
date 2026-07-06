# Gemini AI Integration - Phase 3 Module 3.2

## Overview
Successfully integrated Google Gemini AI into the CyberShield chatbot to replace static rule-based responses with intelligent, context-aware AI responses.

## What Was Implemented

### Backend Changes

#### 1. Environment Variables (`.env`)
```env
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.2
AI_MAX_TOKENS=2048
```

#### 2. Configuration (`app/config/settings.py`)
- Added Gemini API configuration settings
- Supports configurable model, temperature, and max tokens
- Falls back to rule-based system if API key not set

#### 3. Dependencies (`requirements.txt`)
- Added `google-generativeai` SDK

#### 4. New Services

**`app/services/gemini_service.py`**
- Initializes Gemini AI client once at startup
- Generates AI responses with retry logic (3 attempts with exponential backoff)
- Parses JSON responses from Gemini
- Automatic fallback to rule-based chatbot if Gemini fails
- Returns structured response with provider, model, response time, and answer

**`app/services/prompt_builder.py`**
- Builds comprehensive prompts with full project context
- Includes: project details, technology stack, threats, risk summary, recommendations
- Forces Gemini to respond in structured JSON format
- Provides clear instructions for professional security consultation

#### 5. Updated Schema (`app/schemas/chatbot_schema.py`)
```python
class ChatResponse(BaseModel):
    provider: str          # "Gemini" or "Fallback"
    model: str            # Model name (e.g., "gemini-2.5-flash")
    answer: Dict[str, Any] # Structured response
    response_time: Optional[float]  # Response time in seconds
    error: Optional[str]  # Error message if any
```

#### 6. Updated API Routes (`app/routes/chatbot_routes.py`)
- Modified `/chatbot/ask` to use Gemini AI with fallback
- Added `/chatbot/health` endpoint to check AI availability
- Integrates context builder for project-aware responses
- Saves enhanced chat data to Google Sheets

#### 7. Google Sheets Integration (`app/services/google_sheets_service.py`)
- Updated `save_chat_to_sheet()` to store:
  - AI Provider (Gemini/Fallback)
  - Model name
  - Response time
- Expanded ChatHistory sheet to 7 columns

### Frontend Changes

#### `frontend/src/pages/AIAssistant.jsx`
- **AI Provider Badge**: Shows current AI provider (Gemini or Rule-Based)
- **Health Check**: Automatically checks AI status on page load
- **Structured Response Display**:
  - Title
  - Summary
  - Business Impact (highlighted in red)
  - Recommendation (highlighted in green)
  - Implementation Steps (numbered list)
  - Secure Code Example (syntax-highlighted code block)
- **Typing Indicator**: Shows "🤖 Gemini is thinking..." while loading
- **Response Metadata**: Displays model name and response time
- **Error Handling**: Graceful fallback UI on errors

## Response Format

### Expected JSON Structure from Gemini
```json
{
  "title": "Weak JWT Secret",
  "summary": "The application uses an insecure signing key...",
  "business_impact": "Attackers may forge tokens...",
  "recommendation": "Use a 256-bit secure key...",
  "implementation_steps": [
    "Generate secure secret using: openssl rand -hex 32",
    "Store secret in .env file",
    "Load secret in FastAPI"
  ],
  "secure_code": "SECRET_KEY = os.getenv('SECRET_KEY')"
}
```

### API Response Format
```json
{
  "provider": "Gemini",
  "model": "gemini-2.5-flash",
  "response_time": 1.3,
  "answer": {
    "title": "...",
    "summary": "...",
    "business_impact": "...",
    "recommendation": "...",
    "implementation_steps": [...],
    "secure_code": "..."
  }
}
```

## Fallback Mode

If Gemini AI is unavailable:
1. Automatically falls back to rule-based chatbot
2. Returns structured response with:
   - Provider: "Fallback"
   - Model: "rule-based"
   - Answer from existing knowledge base
3. Frontend displays fallback badge
4. No user-facing errors

## Testing

### Test Questions (from requirements)
1. "Explain SQL Injection like I'm a beginner."
2. "Why is my project High Risk?"
3. "How do I fix XSS in React?"
4. "Give me secure JWT authentication code in FastAPI."
5. "How do I secure my AWS S3 bucket?"
6. "Explain my GitHub scan result."
7. "What should I fix first?"

### API Endpoints

**POST `/api/v1/chatbot/ask`**
```json
Request:
{
  "project_id": "PROJECT123",
  "question": "How do I secure my JWT authentication?"
}

Response:
{
  "provider": "Gemini",
  "model": "gemini-2.5-flash",
  "answer": { ... }
}
```

**GET `/api/v1/chatbot/health`**
```json
Response:
{
  "status": "healthy",
  "provider": "Gemini",
  "model": "gemini-2.5-flash"
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd Final-Year-Project/cybershield/backend
pip install -r requirements.txt
```

### 2. Configure Gemini API Key
Edit `.env` file:
```env
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### 3. Get Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy to `.env` file

### 4. Start Backend
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Test Integration
```bash
# Check health
curl http://localhost:8000/api/v1/chatbot/health

# Ask question
curl -X POST http://localhost:8000/api/v1/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test","question":"What is XSS?"}'
```

## Features Implemented

✅ PART 1 - Install Gemini SDK
✅ PART 2 - Environment Variables
✅ PART 3 - Config
✅ PART 4 - AI Service
✅ PART 5 - Initialize Gemini
✅ PART 6 - Prompt Builder
✅ PART 7 - AI Response Format (JSON)
✅ PART 8 - Context Injection
✅ PART 9 - API Route
✅ PART 10 - Fallback Mode
✅ PART 11 - Save AI Responses
✅ PART 12 - Swagger Testing
✅ PART 13 - Test Questions (UI ready)
✅ PART 14 - Frontend (structured display, code blocks, badges)
✅ PART 15 - AI Settings (configurable via .env)

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `GEMINI_API_KEY` | - | Your Gemini API key (required) |
| `AI_PROVIDER` | `gemini` | AI provider name |
| `AI_MODEL` | `gemini-2.5-flash` | Gemini model to use |
| `AI_TEMPERATURE` | `0.2` | Creativity level (0.0-1.0) |
| `AI_MAX_TOKENS` | `2048` | Maximum response length |

## Notes

- Gemini client initializes once at startup (singleton pattern)
- Retry logic: 3 attempts with exponential backoff (2s, 4s, 8s)
- JSON parsing is flexible (handles markdown code blocks)
- All responses are structured for consistent frontend rendering
- Chat history saved to both memory and Google Sheets
- Fallback ensures chatbot always responds, even without API key

## Next Steps

1. Get Gemini API key from Google AI Studio
2. Update `.env` with actual API key
3. Test with sample questions
4. Monitor response quality and adjust prompt if needed
5. Consider adding streaming responses for better UX
6. Add rate limiting for API calls
7. Implement token counting for cost tracking