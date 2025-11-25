# MediChain - Local Deployment Guide

This README explains only what you actually need: how to install dependencies and run the backend and frontend locally on your machine. No production steps, no nginx, no advanced setup.

---

## 1. Project Structure

```
MEDICHAIN/
├── Medicare-Backend/        # FastAPI backend
├── Medicare-Frontend/       # React + Vite + Tailwind frontend
├── .gitignore
└── README.md
```

---

## 2. Prerequisites

Install these on your system:

* Python 3.10+
* Node.js 18+
* npm
* Git

---

## 3. Backend Setup (FastAPI)

### Step 1: Go to backend folder

```
cd Medicare-Backend
```

### Step 2: Create virtual environment

```
python3 -m venv venv
```

### Step 3: Activate virtual environment

**Windows:**

```
venv\Scripts\activate
```

**Mac / Linux:**

```
source venv/bin/activate
```

### Step 4: Install dependencies

```
pip install -r requirements.txt
```

If `requirements.txt` is missing:

```
pip install fastapi uvicorn python-multipart pydantic requests
```

### Step 5: Run backend

```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at:

```
http://localhost:8000
```

---

## 4. Frontend Setup (React + Vite)

### Step 1: Go to frontend folder

```
cd Medicare-Frontend
```

### Step 2: Install dependencies

```
npm install
```

### Step 3: Set API URL

Create `.env` inside **Medicare-Frontend**:

```
VITE_API_URL=http://localhost:8000
```

### Step 4: Run frontend

```
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## 5. Connecting Frontend with Backend

If backend runs on port 8000 and frontend on port 5173, it will work automatically when:

```
VITE_API_URL=http://localhost:8000
```

No further setup required.

---

## 6. Database Configuration Reminder

Before running the backend, the user must modify the `connection.py` file inside **Medicare-Backend/app/database** and manually set their own database details.

Example:

```
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DB=your_database
MYSQL_HOST=localhost
MYSQL_PORT=3306
```

Make sure to replace:

* `your_username` with your actual database username
* `your_password` with your database password
* `your_database` with the name of your database

These values must be created by the user because they are not included in the repositor

---

## 6. Common Errors

### CORS blocked

Add this in `main.py`:

```
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Module not found

```
pip install -r requirements.txt
```

### Blank page in frontend

Check `.env` for correct backend URL.

---

## 7. Summary

* Backend runs on port 8000
* Frontend runs on port 5173
* Use `.env` only for the frontend
* No extra configuration needed

---
