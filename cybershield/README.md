# 🛡️ CyberShield

> Final Year Project — A cybersecurity platform built with FastAPI + React.

---

## 📁 Project Structure

```
cybershield/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # App entry point
│   │   ├── config/        # Settings & environment config
│   │   ├── database/      # DB session & connection
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic layer
│   │   ├── utils/         # Helper utilities (JWT, etc.)
│   │   └── middleware/    # Auth guards & middleware
│   ├── requirements.txt
│   └── .env
│
├── frontend/          # React (Vite) frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/              # Project documentation
└── README.md
```

---

## 🚀 Getting Started

### Backend

```bash
cd cybershield/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API will be available at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend

```bash
cd cybershield/frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🧰 Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | FastAPI, SQLAlchemy     |
| Auth      | JWT (python-jose)       |
| Database  | SQLite (dev) / PostgreSQL (prod) |
| Frontend  | React 18, Vite          |
| Styling   | CSS / TailwindCSS       |

---

## 📄 License

MIT License © 2026 CyberShield Team
