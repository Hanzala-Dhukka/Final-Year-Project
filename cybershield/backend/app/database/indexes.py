"""
MongoDB Index Initialization (Module E5, Part 4).

Creates performance indexes on key collections. Called once at startup.
Safe to run repeatedly — indexes are only created if they don't exist.
"""
from app.database.db import database
from app.services.error_log_service import fire_and_forget_log


async def ensure_indexes() -> None:
    """
    Create all required indexes for CyberShield collections.

    Run during app startup to ensure fast queries on:
    - users (email lookup)
    - github_scans / scans (user scan history)
    - ai_chat_history (user chat history)
    - learning_recommendations (user recommendations)
    - scan_summaries (scan lookup)
    - quiz_results (user quiz history)
    - ai_context (user context)
    """
    indexes = [
        # Users
        ("users", [{"keys": [("email", 1)], "name": "idx_users_email", "unique": True}]),

        # GitHub scans — user history (newest first)
        ("github_scans", [
            {"keys": [("user_id", 1), ("created_at", -1)], "name": "idx_scans_user_date"},
        ]),

        # Legacy scans collection
        ("scans", [
            {"keys": [("user_id", 1), ("created_at", -1)], "name": "idx_legacy_scans_user_date"},
        ]),

        # Scan results by scan_id
        ("scan_results", [
            {"keys": [("scan_id", 1)], "name": "idx_scan_results_scan_id"},
        ]),

        # AI chat history
        ("ai_chat_history", [
            {"keys": [("user_id", 1), ("created_at", -1)], "name": "idx_chat_history_user_date"},
        ]),

        # AI conversations
        ("ai_conversations", [
            {"keys": [("user_id", 1), ("updated_at", -1)], "name": "idx_conversations_user_date"},
        ]),

        # Learning recommendations
        ("learning_recommendations", [
            {"keys": [("user_id", 1), ("created_at", -1)], "name": "idx_learning_recs_user_date"},
        ]),

        # User learning progress
        ("user_learning_progress", [
            {"keys": [("user_id", 1)], "name": "idx_learning_progress_user", "unique": True},
        ]),

        # Scan summaries
        ("scan_summaries", [
            {"keys": [("scan_id", 1)], "name": "idx_scan_summaries_scan_id"},
        ]),

        # AI context
        ("ai_context", [
            {"keys": [("user_id", 1)], "name": "idx_ai_context_user", "unique": True},
        ]),

        # Quiz results
        ("quiz_results", [
            {"keys": [("user_id", 1), ("created_at", -1)], "name": "idx_quiz_results_user_date"},
        ]),

        # Dashboard
        ("dashboard", [
            {"keys": [("user_id", 1)], "name": "idx_dashboard_user", "unique": True},
        ]),

        # AI analysis cache
        ("ai_analysis", [
            {"keys": [("finding_id", 1)], "name": "idx_ai_analysis_finding"},
        ]),

        # Server error logs (real-time error monitoring)
        ("log", [
            {"keys": [("DateTime", -1)], "name": "idx_log_datetime"},
            {"keys": [("Error_Type", 1), ("DateTime", -1)], "name": "idx_log_type_date"},
            {"keys": [("Function", 1), ("DateTime", -1)], "name": "idx_log_function_date"},
        ]),
    ]

    for collection_name, index_list in indexes:
        try:
            collection = database[collection_name]
            for idx in index_list:
                keys = idx["keys"]
                name = idx.get("name")
                unique = idx.get("unique", False)
                await collection.create_index(
                    keys,
                    name=name,
                    unique=unique,
                    background=True,
                )
        except Exception as e:
            fire_and_forget_log()
            # Collection may not exist yet — that's fine
            print(f"[Indexes] Skipping {collection_name}: {e}")

    print("[Indexes] MongoDB indexes ensured.")
