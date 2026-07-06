import asyncio
import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime
from app.services.memory_service import get_conversation, append_message, build_context_window
from app.services.gemini_service import get_model
from app.services.prompt_builder import build_prompt
from app.config.settings import settings
import google.generativeai as genai


class StreamingService:
    """Handle streaming AI responses"""
    
    @staticmethod
    async def stream_response(
        conversation_id: str,
        question: str,
        project_context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response token by token
        
        Args:
            conversation_id: Conversation ID
            question: User's question
            project_context: Optional project context
            
        Yields:
            Response chunks
        """
        try:
            # Get conversation history
            context_window = build_context_window(conversation_id, max_messages=10)
            
            # Build full prompt
            full_question = f"{context_window}\n{question}" if context_window else question
            
            # Get project context if not provided
            if not project_context:
                from app.services.context_builder import build_context
                project_context = build_context(None)
            
            # Build prompt with context
            prompt = build_prompt(full_question, project_context)
            
            # Get Gemini model
            model = get_model()
            if not model:
                yield json.dumps({
                    "type": "error",
                    "content": "AI service unavailable. Using fallback mode."
                })
                return
            
            # Configure generation
            generation_config = {
                "temperature": settings.AI_TEMPERATURE,
                "max_output_tokens": settings.AI_MAX_TOKENS,
            }
            
            # Generate streaming response
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                stream=True
            )
            
            full_response = ""
            
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield json.dumps({
                        "type": "chunk",
                        "content": chunk.text
                    })
            
            # Send completion signal
            yield json.dumps({
                "type": "complete",
                "content": full_response
            })
            
            # Save to conversation history
            append_message(conversation_id, "user", question)
            append_message(conversation_id, "assistant", full_response, metadata={
                "provider": "Gemini",
                "model": settings.AI_MODEL,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "content": f"Error: {str(e)}"
            })
    
    @staticmethod
    async def generate_suggested_questions(conversation_id: str, last_answer: str) -> List[str]:
        """
        Generate suggested follow-up questions based on conversation
        
        Args:
            conversation_id: Conversation ID
            last_answer: Last AI response
            
        Returns:
            List of suggested questions
        """
        try:
            # Get conversation context
            history = build_context_window(conversation_id, max_messages=5)
            
            # Build prompt for generating questions
            prompt = f"""Based on the following conversation, suggest 3 relevant follow-up questions that the user might want to ask next.

Conversation:
{history}

Last Response:
{last_answer}

Generate 3 short, specific follow-up questions related to security topics discussed.
Format as a JSON array of strings:
["Question 1", "Question 2", "Question 3"]

Only return the JSON array, no other text:"""
            
            model = get_model()
            if not model:
                return [
                    "Can you explain more?",
                    "Show me code examples",
                    "What are the best practices?"
                ]
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 200
                }
            )
            
            # Parse response
            try:
                # Extract JSON from response
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                questions = json.loads(response_text)
                if isinstance(questions, list) and len(questions) > 0:
                    return questions[:3]
            except:
                pass
            
            return [
                "Can you explain more?",
                "Show me code examples",
                "What are the best practices?"
            ]
        
        except Exception as e:
            print(f"Error generating suggested questions: {e}")
            return [
                "Tell me more",
                "Show implementation steps",
                "What's the business impact?"
            ]