@echo off
echo Starting Maya AI Stack...

:: Start Backend
start cmd /k "cd backend && python main.py"

:: Start Frontend
start cmd /k "cd frontend && npm run dev"

echo Maya is warming up. Check the new windows for status!