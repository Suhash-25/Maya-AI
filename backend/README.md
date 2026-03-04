# Maya-AI

Minimal instructions to run the backend and frontend locally.

## Prerequisites
- Python 3.10-3.13 recommended (Python 3.14 may show Pydantic warnings).
- Node.js (18+ recommended) and npm.
- (Optional) Ollama installed & running if you want local LLM inference via `langchain_ollama`.

## Backend (FastAPI)
1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

3. Run the server:

```powershell
uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000` (example: `/profile`).

## Frontend (Vite + React)
1. Install dependencies and run dev server:

```powershell
cd frontend
npm install
npm run dev
```

The frontend dev server typically runs at `http://localhost:5173` and is configured to call the backend at `http://127.0.0.1:8000`.

## Notes
- The backend uses `langchain_ollama` — if you do not have Ollama, remove or adapt the usage in `backend/main.py`.
- A local SQLite file `backend/memory.db` is used for simple persistence and is ignored by `.gitignore`.

If you want, I can push these commits to your GitHub remote or add a more detailed developer guide.
