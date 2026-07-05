"""Quick local test for technology_detector.py."""
import sys, os
sys.path.insert(0, os.path.abspath("."))

from app.services.technology_detector import detect_technologies

# Simulated file tree for the Final-Year-Project repo
fake_paths = [
    "cybershield/backend/requirements.txt",
    "cybershield/frontend/package.json",
    "cybershield/backend/Dockerfile",
    "cybershield/backend/docker-compose.yml",
    ".github/workflows/ci.yml",
    "cybershield/frontend/tsconfig.json",
]

result = detect_technologies(
    fake_paths,
    "Hanzala-Dhukka/Final-Year-Project",
    "main"
)

print("Technology Detection Result:")
for cat, items in result.items():
    print(f"  {cat}: {items}")
