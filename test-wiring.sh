#!/bin/bash

# Test script for AgriSense wiring
# This script tests the complete backend→frontend flow

echo "🧪 Testing AgriSense Wiring"
echo "============================"
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "  URL: GET http://localhost:8000/health"
HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ -z "$HEALTH" ]; then
    echo "  ❌ Failed: Backend not responding"
    echo "     Make sure backend is running: python -m uvicorn backend.mainbot:app --reload --port 8000"
else
    echo "  ✅ Passed"
    echo "  Response: $HEALTH"
fi

echo ""

# Test 2: Backend Chat Endpoint Structure
echo "Test 2: Backend Chat Endpoint"
echo "  URL: POST http://localhost:8000/chat"
echo "  Request: {\"question\": \"What is farming?\", \"session_id\": \"test-user\"}"

CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is farming?", "session_id": "test-user"}' 2>/dev/null)

if [ -z "$CHAT_RESPONSE" ]; then
    echo "  ❌ Failed: No response from backend"
    echo "     Make sure:"
    echo "     1. Backend is running"
    echo "     2. GROQ_API_KEY is set in backend/.env"
    echo "     3. PDFs are in /data/ folder"
else
    echo "  ✅ Passed"
    echo "  Response received"
    
    # Check if response contains expected fields
    if echo "$CHAT_RESPONSE" | grep -q "answer"; then
        echo "  ✅ Response has 'answer' field"
    fi
    
    if echo "$CHAT_RESPONSE" | grep -q "sources"; then
        echo "  ✅ Response has 'sources' field"
    fi
    
    if echo "$CHAT_RESPONSE" | grep -q "source_count"; then
        echo "  ✅ Response has 'source_count' field"
    fi
    
    echo ""
    echo "  Full Response:"
    echo "$CHAT_RESPONSE" | python -m json.tool 2>/dev/null || echo "$CHAT_RESPONSE"
fi

echo ""

# Test 3: Frontend Availability
echo "Test 3: Frontend Availability"
echo "  URL: GET http://localhost:3000"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "  ✅ Passed - Frontend is running"
else
    echo "  ❌ Failed: Frontend returned $FRONTEND_STATUS"
    echo "     Make sure frontend is running: npm run dev"
fi

echo ""

# Test 4: Chat History API
echo "Test 4: Chat History API"
echo "  URL: GET http://localhost:3000/api/chat-history"
HISTORY_RESPONSE=$(curl -s "http://localhost:3000/api/chat-history?userId=default-user" 2>/dev/null)
if [ -z "$HISTORY_RESPONSE" ]; then
    echo "  ❌ Failed: No response"
else
    echo "  ✅ Passed"
    echo "  Response received"
fi

echo ""
echo "============================"
echo "✅ Wiring Test Complete!"
echo "============================"
echo ""
echo "📝 To use AgriSense:"
echo "1. Update backend/.env with your GROQ_API_KEY"
echo "2. Navigate to http://localhost:3000"
echo "3. Click 'Chat' in the navigation"
echo "4. Type your farming question and click Send"
echo ""
