import requests

url = "http://localhost:8000/api/v1/github/scan-repository"
data = {"repo_url": "https://github.com/Hanzala-Dhukka/Final-Year-Project"}
try:
    response = requests.post(url, json=data, timeout=30)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error calling endpoint:", e)
