import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.repositories.user_repository import user_repository
from app.repositories.progress_repository import progress_repository
from app.repositories.github_repository import github_repository
from app.repositories.security_report_repository import security_report_repository
from app.repositories.chat_repository import chat_repository
from app.repositories.challenge_repository import challenge_repository
from app.repositories.quiz_repository import quiz_repository
from app.repositories.owasp_repository import owasp_repository
from app.services.profile_service import profile_service
from app.services.security_score_service import security_score_service

USER_ID = "6a4ffa43ddf2f5b0d055f882"


async def test():
    print("=" * 60)
    print("TESTING DASHBOARD DEPENDENCIES")
    print("=" * 60)
    
    # Test 1: User Repository
    print("\n1. USER REPOSITORY")
    print("-" * 60)
    try:
        user = await user_repository.get_user_by_id(USER_ID)
        if user:
            print(f"✓ User found: {user.get('email', 'N/A')}")
        else:
            print("✗ User not found (returned None)")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Profile Service
    print("\n2. PROFILE SERVICE")
    print("-" * 60)
    try:
        profile = await profile_service.get_user_profile(USER_ID)
        if profile:
            print(f"✓ Profile found: {profile.get('username', 'N/A')}")
        else:
            print("✗ Profile not found (returned None)")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Security Score Service
    print("\n3. SECURITY SCORE SERVICE")
    print("-" * 60)
    try:
        score = await security_score_service.get_security_score(USER_ID)
        if score:
            print(f"✓ Security score found: {score.get('score', 'N/A')}")
        else:
            print("✗ Security score not found (returned None)")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 4: Progress Repository
    print("\n4. PROGRESS REPOSITORY")
    print("-" * 60)
    try:
        progress = await progress_repository.get_progress_by_user(USER_ID)
        if progress:
            print(f"✓ Progress found: XP={progress.get('xp', 0)}, Level={progress.get('level', 1)}")
        else:
            print("✗ Progress not found (returned None or empty)")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 5: GitHub Scans
    print("\n5. GITHUB SCANS")
    print("-" * 60)
    try:
        scans = await github_repository.get_scans_by_user(USER_ID, limit=10)
        print(f"✓ Found {len(scans)} scans")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 6: Security Reports
    print("\n6. SECURITY REPORTS")
    print("-" * 60)
    try:
        reports = await security_report_repository.get_reports_by_user(USER_ID, limit=10)
        print(f"✓ Found {len(reports)} reports")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 7: Chat History
    print("\n7. CHAT HISTORY")
    print("-" * 60)
    try:
        chats = await chat_repository.get_chats_by_user(USER_ID, limit=10)
        print(f"✓ Found {len(chats)} chat sessions")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 8: Daily Challenge
    print("\n8. DAILY CHALLENGE")
    print("-" * 60)
    try:
        challenge = await challenge_repository.get_today_challenge(USER_ID)
        if challenge:
            print(f"✓ Challenge found: {challenge.get('title', 'N/A')}")
        else:
            print("✗ No challenge found (returned None or empty)")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 9: Quiz Attempts
    print("\n9. QUIZ ATTEMPTS")
    print("-" * 60)
    try:
        quizzes = await quiz_repository.get_quiz_attempts_by_user(USER_ID, limit=10)
        print(f"✓ Found {len(quizzes)} quiz attempts")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 10: OWASP Attempts
    print("\n10. OWASP SIMULATIONS")
    print("-" * 60)
    try:
        owasp = await owasp_repository.get_attempts_by_user(USER_ID, limit=10)
        print(f"✓ Found {len(owasp)} OWASP attempts")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test())