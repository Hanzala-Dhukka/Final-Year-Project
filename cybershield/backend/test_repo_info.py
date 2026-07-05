import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.services.repository_info import get_repository_info

try:
    print("Fetching repository info for OWASP/WebGoat...")
    info = get_repository_info("https://github.com/OWASP/WebGoat")
    print("SUCCESS:")
    for k, v in info.items():
        print(f"  {k}: {v}")
except Exception as e:
    print("ERROR failed to fetch repo info:", e)
