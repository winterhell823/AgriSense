# AgriSense - Frontend & Backend Wiring Guide

## ✅ What's Been Wired

The frontend chat component and FastAPI RAG backend are now fully integrated. Here's what happens:

### Flow:
1. **User types question** → Frontend chat component
2. **User clicks Send** → Frontend POSTs to `http://localhost:8000/chat`
3. **Backend receives question** → Retrieves PDF context via FAISS + Groq LLM
4. **Backend returns answer** → with sources and citations
5. **Frontend displays answer** → in chat UI with message history
6. **Conversation saved** → to 7-day chat history via `/api/chat-history`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (for Next.js frontend)
- Python 3.9+ (for FastAPI backend)  
- GROQ API Key (get one free at https://console.groq.com)

### Step 1: Configure Backend

**Edit `backend/.env`** and add your GROQ API key:

```bash
# backend/.env
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.3
RAG_TOP_K=4
CORS_ORIGINS=http://localhost:3000
AGRI_DATA_DIR=../data
AGRI_VECTORSTORE_DIR=./vectorstore/db_faiss
```

Get your free key: https://console.groq.com/keys

### Step 2: Start Backend

From project root:

```bash
# Activate Python environment
source .venv/bin/activate

# Start backend (auto-indexes PDFs on first run)
cd backend
python -m uvicorn mainbot:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started server process [PID]
```

✅ **Test backend**: http://localhost:8000/docs (Swagger UI)

### Step 3: Start Frontend

In another terminal, from project root:

```bash
npm run dev
```

You should see:
```
▲ Next.js 15.5.18
✓ Ready in 1.23s
```

✅ **Access frontend**: http://localhost:3000

---

## 🧪 Testing End-to-End

1. **Navigate to Chat Page**
   - Click "Chat" in the navigation bar
   - You should see the input area with command suggestions

2. **Send a Question**
   - Type: `How do I detect crop disease?`
   - Click Send or press Enter
   - You should see:
     - User message appears on right
     - "Analyzing..." indicator while backend processes
     - AI response appears on left with sources

3. **Verify Chat History**
   - Click "Chat History" in nav bar
   - Your conversation should appear (persisted for 7 days)
   - Shows date groups

---

## 📊 Backend Architecture

### `/chat` Endpoint (POST)

**Request:**
```json
{
  "question": "What is the best way to water crops?",
  "session_id": "default-user"
}
```

**Response:**
```json
{
  "answer": "Based on the agricultural guides, the best practices for watering crops include...",
  "sources": [
    "Document_Title.pdf - Page 3",
    "Guide_to_Farming.pdf - Page 15"
  ],
  "source_count": 2,
  "session_id": "default-user"
}
```

### `/health` Endpoint (GET)

Simple health check:
```bash
curl http://localhost:8000/health
# Returns: {"status": "ok"}
```

### API Documentation

Interactive Swagger UI available at:
```
http://localhost:8000/docs
```

---

## 🔌 Frontend Components

### Chat Component (`components/ui/animated-ai-chat.tsx`)

**Key Features:**
- Message display with user/assistant differentiation
- Auto-scrolling to latest messages
- Real-time typing with loading indicator
- Source citations from PDF documents
- Command palette with suggestions (/detect, /tips, /weather, /guide)
- File attachments (prepared for future image analysis)
- Error handling with user-friendly messages
- 7-day chat history persistence

**Key Functions:**
- `handleSendMessage()` - Sends message to backend, displays response
- `storeMessage()` - Persists conversation to chat history
- Auto-scroll on new messages

### Chat History Page (`app/chat-history/page.tsx`)

- Loads all messages from `/api/chat-history`
- Groups by date (last 7 days)
- Displays both user and assistant messages
- Shows empty state if no messages

---

## 📁 Data & Storage

### PDF Storage (`/data/` folder)
- Currently contains 3 agriculture PDFs
- Automatically indexed on first backend start
- Creates FAISS vector store: `backend/vectorstore/db_faiss/`
- Add more PDFs to `/data/` and restart backend to re-index

### Chat History Storage (`backend/data/chat-history.json`)
- Automatically created by Next.js API
- Stores user + assistant messages
- Includes timestamps and attachments
- Auto-purges messages older than 7 days

---

## 🛠️ Customization

### Change Backend Port
Edit `backend/.env`:
```
PORT=8001  # Change from 8000 to 8001
```

### Adjust LLM Temperature
Lower = more deterministic, Higher = more creative:
```
GROQ_TEMPERATURE=0.5  # Range: 0.0 - 1.0
```

### Change PDF Context Size
How many PDF chunks to retrieve for each question:
```
RAG_TOP_K=6  # Default: 4, max suggested: 8
```

### Add More PDFs
1. Place PDF files in `/data/` folder
2. Restart backend (vector store will re-index automatically)
3. Ask questions - the LLM will now use the new PDFs

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python environment
which python
# Should show: /Users/vaibhavsharma/test5/.venv/bin/python

# Reinstall dependencies
pip install -r backend/requirements.txt

# Check port isn't in use
lsof -i :8000
```

### "Connection refused" when sending messages
- [ ] Backend is running on port 8000
- [ ] GROQ_API_KEY is set in `backend/.env`
- [ ] Frontend can reach `http://localhost:8000`

### No answers from backend
- [ ] Check backend logs for errors
- [ ] Verify GROQ_API_KEY is valid
- [ ] Ensure PDFs are in `/data/` folder
- [ ] Check FAISS vector store was created: `ls backend/vectorstore/db_faiss/`

### Chat history not saving
- [ ] Check `/backend/data/chat-history.json` exists
- [ ] Verify permissions: `ls -la backend/data/`
- [ ] Clear browser cache and try again

---

## 📚 Files Modified/Created

### Updated:
- `components/ui/animated-ai-chat.tsx` - Now sends to backend + displays RAG answers
- `backend/mainbot.py` - FastAPI app with `/chat` endpoint
- `backend/rag_pipeline.py` - Groq LLM + FAISS integration
- `backend/llm_memory.py` - PDF indexing and vector store management

### Created:
- `backend/.env` - Configuration (add your GROQ_API_KEY here)
- `start-services.sh` - Convenient startup script

---

## 🚀 Next Steps

1. ✅ Configure `backend/.env` with GROQ_API_KEY
2. ✅ Start backend: `python -m uvicorn backend.mainbot:app --reload --port 8000`
3. ✅ Start frontend: `npm run dev`
4. ✅ Visit http://localhost:3000 → Click "Chat"
5. ✅ Ask a farming question and get AI-powered answers!

---

## 📞 Support

For issues with:
- **Frontend/Chat UI**: Check browser console for errors
- **Backend/API**: Check terminal where backend is running
- **PDFs not being found**: Verify `/data/` folder has PDFs and restart backend
- **GROQ errors**: Verify API key is valid at https://console.groq.com

---

Happy farming! 🌾
