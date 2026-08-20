"""
Error logging service.

Records every exception into the MongoDB `log` collection in real time so that
server-side errors (e.g. a changed API requirement breaking a function) can be
inspected later with full context.

Every entry stores:
- DateTime, Folder_Name, File_Name, Function, Line
- Error_Message, Error_Type, full Traceback
- System_Info (host, OS, python version, process / thread ids)
- Extra_Info (caller-supplied context such as request path, user, payload keys)
"""
import asyncio
import inspect
import os
import platform
import socket
import sys
import threading
import traceback
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Dict, Optional

from app.database.db import database
from app.websocket.manager import ConnectionManager

LOG_COLLECTION = "log"

# Dedicated WebSocket manager so real-time log events never leak into the
# dashboard stream (and vice versa).
log_manager = ConnectionManager()


def get_current_datetime() -> str:
    """ISO-8601 timestamp (UTC) used for every log entry."""
    return datetime.now(timezone.utc).isoformat()


def _safe_get_ip(hostname: str) -> str:
    try:
        return socket.gethostbyname(hostname)
    except Exception:
        return "0.0.0.0"


def _capture_system_info() -> Dict[str, Any]:
    hostname = socket.gethostname()
    return {
        "Host": hostname,
        "IP": _safe_get_ip(hostname),
        "OS": platform.system(),
        "OS_Version": platform.version(),
        "Python_Version": platform.python_version(),
        "Process_ID": os.getpid(),
        "Thread": str(threading.get_ident()),
        "Working_Dir": os.getcwd(),
    }


async def _broadcast_log(data: Dict[str, Any]) -> None:
    """Push the log entry to every connected /ws/logs client (best-effort)."""
    try:
        await log_manager.broadcast({"event": "log", "data": data})
    except Exception:
        pass


async def log_error(
    folder_name: str,
    file_name: str,
    function: str,
    error: Exception,
    extra_info: dict = None,
) -> Optional[str]:
    """
    Write a full error report into the `log` collection in real time.

    Designed to be called from inside any `except` block (or from the global
    exception handler), so the traceback of the active exception is captured
    automatically. If called outside an active `except`, it falls back to
    ``error.__traceback__``.

    Returns the inserted MongoDB ``_id`` as a string, or ``None`` if the
    database write failed.
    """
    exc_type, exc_value, exc_tb = sys.exc_info()
    if exc_type is None:
        exc_type = type(error)
        exc_value = error
        exc_tb = getattr(error, "__traceback__", None)

    tb_str = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
    line = exc_tb.tb_lineno if exc_tb is not None else None

    data = {
        "DateTime": get_current_datetime(),
        "Folder_Name": folder_name,
        "File_Name": file_name,
        "Function": function,
        "Error_Message": str(error),
        "Error_Type": exc_type.__name__ if exc_type else type(error).__name__,
        "Line": line,
        "Traceback": tb_str,
        "System_Info": _capture_system_info(),
        "Extra_Info": extra_info or {},
    }

    print(
        f"\n[ERROR LOG]\n"
        f"DateTime: {data['DateTime']}\n"
        f"Location: {folder_name}/{file_name}:{line} | Function: {function}\n"
        f"Type: {data['Error_Type']} | Message: {data['Error_Message']}\n"
        f"Traceback:\n{tb_str}"
        f"Line: {line}\n"
    )

    await _broadcast_log(data)

    inserted_id: Optional[str] = None
    try:
        result = await database[LOG_COLLECTION].insert_one(data)
        inserted_id = str(getattr(result, "inserted_id", None) or "")
    except Exception:
        inserted_id = None
    return inserted_id or None


async def log_exception(
    folder_name: str,
    file_name: str,
    function: str,
    error: Exception,
    extra_info: dict = None,
) -> Optional[str]:
    """Alias of :func:`log_error` for readability inside `except` blocks."""
    return await log_error(folder_name, file_name, function, error, extra_info)


def fire_and_forget_log(
    folder_name: str,
    file_name: str,
    function: str,
    error: Exception,
    extra_info: dict = None,
) -> None:
    """
    Schedule logging without awaiting it — usable from sync code such as
    scheduler jobs, background threads, or callbacks that cannot block.
    """
    coro = log_error(folder_name, file_name, function, error, extra_info)
    try:
        asyncio.get_running_loop().create_task(coro)
    except RuntimeError:
        try:
            loop = asyncio.new_event_loop()
            loop.create_task(coro)
        except Exception:
            pass
    except Exception:
        pass


def _derive_location(func: Callable) -> tuple:
    """Auto-derive (folder_name, file_name) from the wrapped function's file."""
    folder_name = file_name = None
    try:
        source_file = inspect.getsourcefile(func)
        if source_file:
            file_name = os.path.basename(source_file)
            folder_name = os.path.basename(os.path.dirname(source_file))
    except Exception:
        pass
    return folder_name, file_name


def with_error_logging(
    folder_name: str = None,
    file_name: str = None,
    extra_info: dict = None,
) -> Callable:
    """
    Decorator that logs any exception raised by the wrapped function into the
    `log` collection, then re-raises it.

    Works for both async and sync functions. When ``folder_name`` / ``file_name``
    are omitted they are derived from the function's source file automatically.

    Usage::

        @with_error_logging(extra_info={"module": "reports"})
        async def generate_report(user_id: str) -> bytes:
            ...

    The decorator NEVER swallows the exception — the caller still receives it.
    """

    def decorator(func: Callable) -> Callable:
        actual_folder = folder_name
        actual_file = file_name
        if actual_folder is None or actual_file is None:
            derived_folder, derived_file = _derive_location(func)
            actual_folder = actual_folder or derived_folder or "app"
            actual_file = actual_file or derived_file or getattr(func, "__module__", "unknown")

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                await log_error(actual_folder, actual_file, func.__name__, e, extra_info)
                raise

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                fire_and_forget_log(actual_folder, actual_file, func.__name__, e, extra_info)
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator