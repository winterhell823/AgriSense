#!/bin/bash

# AgriSense Frontend + Backend Wiring Guide
# This script helps you start both the frontend and backend services

echo "🌾 AgriSense - Starting Frontend + Backend"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env not found!${NC}"
    echo "Please create backend/.env with your GROQ_API_KEY:"
    echo ""
    echo "  cp backend/.env.example backend/.env"
    echo "  # Edit backend/.env and add your GROQ_API_KEY"
    exit 1
fi

# Check if GROQ_API_KEY is set
if grep -q "your_groq_api_key_here" backend/.env; then
    echo -e "${RED}Warning: GROQ_API_KEY is not configured!${NC}"
    echo "Please update backend/.env with your actual GROQ_API_KEY"
    echo ""
fi

echo -e "${YELLOW}Starting Backend (FastAPI on port 8000)...${NC}"
cd backend 2>/dev/null || cd ./backend 2>/dev/null || {
    echo -e "${RED}Error: Cannot find backend directory${NC}"
    exit 1
}

# Start backend in background
source ../.venv/bin/activate 2>/dev/null || source .venv/bin/activate 2>/dev/null
python -m uvicorn mainbot:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo "Backend available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""

# Wait a moment for backend to start
sleep 2

# Check backend health
echo -e "${YELLOW}Checking backend health...${NC}"
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

echo ""
echo -e "${YELLOW}Starting Frontend (Next.js on port 3000)...${NC}"
cd ..

npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
echo "Frontend available at: http://localhost:3000"
echo ""

echo -e "${GREEN}=========================================="
echo "✓ All services started successfully!"
echo "=========================================="
echo ""
echo "🌐 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:8000"
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "To stop services, press Ctrl+C"
echo "=========================================="
echo ""

# Wait for both processes
wait
