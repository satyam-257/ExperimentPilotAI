@echo off
echo ========================================================
echo Starting ExperimentPilot Backend (FastAPI) and Frontend (Vite)
echo ========================================================
echo.
echo Launching Backend on http://127.0.0.1:8000 ...
start "ExperimentPilot Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Launching Frontend on http://localhost:5173 ...
start "ExperimentPilot Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Web App:      http://localhost:5173
echo ========================================================
