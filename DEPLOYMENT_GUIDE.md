# AgriSense Deployment Guide (Vercel + Backend Service)

## Overview
- **Frontend:** Deployed on Vercel (Next.js)
- **Backend:** Deployed on Render/Railway/Fly (FastAPI)
- **Frontend communicates with backend** via environment-configured proxy URL

---

## Step 1: Prepare Backend Deployment

### 1a. Create `.env` file for backend (do NOT commit this)
```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env`** and add your real values:
```bash
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.2
GROQ_DISEASE_MODEL=llama3-70b-8192
GROQ_DISEASE_TEMPERATURE=0.2
RAG_TOP_K=4
CORS_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
AGRI_DATA_DIR=../data
AGRI_VECTORSTORE_DIR=./vectorstore/db_faiss
AGRI_MAX_IMAGE_SIZE_MB=10
PORT=8000
```

**Important:** Replace:
- `gsk_your_actual_key_here` → your real Groq API key from https://console.groq.com/keys
- `https://your-vercel-app.vercel.app` → your actual Vercel frontend domain (e.g., `https://agrisense.vercel.app`)

### 1b. Verify backend runs locally
```bash
source .venv/bin/activate
cd backend
python -m uvicorn mainbot:app --reload --port 8000
```

Test endpoints:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"AgriSense backend","image_analysis":"ready"}

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"How do I grow tomatoes?","session_id":"test"}'
# Should return AI answer with sources
```

---

## Step 2: Deploy Backend to Public Service

### Choose one platform:

#### **Option A: Deploy on Render** (recommended for simplicity)

1. **Create Render account:** https://render.com
2. **Push backend files to git** (already done ✓)
3. **Create new Web Service on Render:**
   - GitHub repo: `winterhell823/AgriSense`
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `cd backend && python -m uvicorn mainbot:app --host 0.0.0.0 --port 8000`
   - Instance type: Standard (or higher if needed)
4. **Add environment variables** in Render dashboard:
   ```
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama3-70b-8192
   GROQ_TEMPERATURE=0.2
   GROQ_DISEASE_MODEL=llama3-70b-8192
   GROQ_DISEASE_TEMPERATURE=0.2
   RAG_TOP_K=4
   PORT=8000
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   AGRI_DATA_DIR=./data
   AGRI_VECTORSTORE_DIR=./backend/vectorstore/db_faiss
   ```
5. **Deploy** → Render will build and deploy automatically
6. **Get your backend URL:** e.g., `https://agrisense-backend.onrender.com`

#### **Option B: Deploy on Railway**

1. **Create Railway account:** https://railway.app
2. **Connect GitHub repo**
3. **Add environment variables** (same as above)
4. **Set start command:** `cd backend && python -m uvicorn mainbot:app --host 0.0.0.0 --port 8000`
5. **Deploy** → Your backend URL will be like `https://agrisense-api-prod.up.railway.app`

#### **Option C: Deploy on Fly.io**

1. **Create Fly.io account:** https://fly.io
2. **Install `flyctl` CLI**
3. **Create `Dockerfile` in project root:**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY backend/requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["python", "-m", "uvicorn", "backend.mainbot:app", "--host", "0.0.0.0", "--port", "8080"]
   ```
4. **Deploy:** `fly deploy`
5. **Get your backend URL** from Fly dashboard

---

## Step 3: Test Backend Deployment

After backend is live, test the public URL:

```bash
# Replace with your actual backend URL
BACKEND_URL="https://agrisense-backend.onrender.com"

# Test health endpoint
curl $BACKEND_URL/health

# Test chat endpoint
curl -X POST $BACKEND_URL/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is crop rotation?","session_id":"test"}'
```

If successful, you should see:
```json
{
  "answer": "Crop rotation is...",
  "sources": [...],
  "source_count": 2,
  "session_id": "test"
}
```

---

## Step 4: Deploy Frontend to Vercel

### 4a. Set environment variables in Vercel

1. **Go to Vercel Dashboard** → Your project → Settings → Environment Variables
2. **Add one of these** (choose one):

   **Option 1: Private backend URL (recommended)**
   ```
   BACKEND_API_BASE_URL=https://your-backend-url.onrender.com
   ```

   **Option 2: Public backend URL** (if you want to use NEXT_PUBLIC prefix)
   ```
   NEXT_PUBLIC_BACKEND_API_BASE_URL=https://your-backend-url.onrender.com
   ```

   Replace `https://your-backend-url.onrender.com` with your actual backend URL.

3. **Save** and redeploy frontend

### 4b. Redeploy frontend to Vercel

Option 1: Via Vercel Dashboard
- Settings → Deployments → Redeploy (or push a commit to trigger auto-deploy)

Option 2: Via CLI
```bash
npm install -g vercel
vercel --prod
```

---

## Step 5: Verify End-to-End

1. **Navigate to your Vercel app:** `https://your-vercel-app.vercel.app/chat`
2. **Ask a question** in the chatbot
3. **Expected result:** AI answer with sources (no "500 error")

### If still getting errors:

Check Vercel function logs:
```bash
vercel logs --follow
```

Common issues:
- ❌ `Missing BACKEND_API_BASE_URL` → You didn't set the env var in Vercel
- ❌ `Backend error: 500 GROQ_API_KEY is missing` → Backend doesn't have API key set
- ❌ `Backend error: 404 No PDF files found` → Backend `/data/` folder missing PDFs
- ❌ `Backend error: 503 service unavailable` → Backend service is down (check Render/Railway dashboard)

---

## Environment Variables Summary

### Backend (set in Render/Railway/Fly dashboard)
| Variable | Example | Notes |
|----------|---------|-------|
| `GROQ_API_KEY` | `gsk_...` | Get from https://console.groq.com/keys |
| `GROQ_MODEL` | `llama3-70b-8192` | Groq model name |
| `GROQ_TEMPERATURE` | `0.2` | Lower = more deterministic |
| `CORS_ORIGINS` | `https://agrisense.vercel.app` | Your Vercel domain |
| `PORT` | `8000` | Should match deployment platform |
| `AGRI_DATA_DIR` | `./data` | Path to PDFs (relative to backend dir) |
| `AGRI_VECTORSTORE_DIR` | `./vectorstore/db_faiss` | Vector DB storage path |

### Frontend (set in Vercel dashboard)
| Variable | Example | Notes |
|----------|---------|-------|
| `BACKEND_API_BASE_URL` | `https://agrisense-backend.onrender.com` | Your backend URL (private env) |
| OR |  |  |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | `https://agrisense-backend.onrender.com` | Your backend URL (public env) |

---

## CORS Configuration

The backend CORS origin must include your Vercel domain for requests to work:

**On backend** (Render/Railway env var):
```
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

This allows:
- ✓ Frontend on `https://your-vercel-app.vercel.app` to call backend
- ✓ Local testing on `http://localhost:3000` to call backend

---

## Troubleshooting

### Backend won't start on Render
- Check build logs in Render dashboard
- Verify Python version matches (3.9+)
- Ensure `backend/requirements.txt` is installed

### Chatbot says "Backend error: 500"
- Check backend logs in Render/Railway dashboard
- Look for `GROQ_API_KEY is missing` → Set API key in backend env vars
- Look for `No PDF files found` → Verify `/data/` folder in repo has PDFs

### Chatbot says "Missing BACKEND_API_BASE_URL"
- Check Vercel environment variables are set
- Redeploy after setting env vars (`vercel --prod` or Dashboard redeploy)
- Verify no typos in the URL

### CORS errors in browser console
- Check backend `CORS_ORIGINS` env var includes your Vercel domain
- Redeploy backend after changing CORS settings

---

## Monitoring

### Vercel
- Dashboard → Analytics, Logs, Error Tracking
- Real-time function logs: `vercel logs --follow`

### Render/Railway
- Dashboard shows resource usage and logs
- Restart service if needed

---

## Next Steps

1. ✅ Deploy backend to Render/Railway/Fly
2. ✅ Set `BACKEND_API_BASE_URL` in Vercel
3. ✅ Redeploy Vercel frontend
4. ✅ Test `/chat` page
5. 🎉 Production app is live!

---

## Security Notes

- **Never commit** `backend/.env` with real keys
- **Use Vercel/Render environment variables** for secrets
- **Rotate API keys** if they're ever exposed in git history
- **Keep `CORS_ORIGINS` restricted** to your frontend domain (not `*` in production)

---

## Support

If you get stuck:
1. Check the exact error message in browser console or backend logs
2. Verify all environment variables are set correctly
3. Test backend directly with `curl` to isolate the issue
4. Ensure PDFs are in `backend/data/` folder (for vector store)
