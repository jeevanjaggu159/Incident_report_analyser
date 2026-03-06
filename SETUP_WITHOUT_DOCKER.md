# 🚀 Incident Report Analyzer - Setup & Run (No Docker)

This guide will walk you through setting up and running the full-stack Gen AI application on your local machine.

---

## 📋 Prerequisites

Before you start, ensure you have the following installed:

### 1. **Python 3.9+**
   - Download from https://www.python.org/downloads/
   - Verify: `python --version`

### 2. **PostgreSQL (Local Installation)**
   - Download from https://www.postgresql.org/download/
   - Installation guide: https://www.postgresql.org/docs/current/install-windows.html
   - Start PostgreSQL service after installation
   - Verify: `psql --version`

### 3. **Node.js & npm**
   - Download from https://nodejs.org/
   - Verify: `node --version` and `npm --version`

### 4. **Git** (optional)
   - Used for cloning repositories if needed

---

## 🗄️ Step 1: Setup PostgreSQL Database

### 1.1 Start PostgreSQL Service
```powershell
# Windows - PostgreSQL should start automatically
# Verify it's running by opening pgAdmin or using psql
psql -U postgres
```

### 1.2 Create Database
```sql
-- Connect as postgres user
psql -U postgres

-- Create new database
CREATE DATABASE incident_db;

-- Exit psql
\q
```

### 1.3 Verify Connection
```powershell
# Test connection (default password is what you set during installation)
psql -U postgres -d incident_db -h localhost
```

---

## 🔧 Step 2: Setup Backend (FastAPI)

### 2.1 Navigate to Backend Directory
```powershell
cd backend
```

### 2.2 Create Python Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2.3 Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables
```powershell
# Copy .env.example to .env
Copy-Item ".env.example" ".env"

# Edit .env with your configuration
# Use Notepad or your preferred editor
notepad .env
```

**Important values to set in .env:**
- `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/incident_db`
- `OPENAI_API_KEY=your_actual_openai_api_key_here`
- `OPENAI_MODEL=gpt-4` (or `gpt-3.5-turbo` if you don't have GPT-4 access)

### 2.5 Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it in your `.env` file

### 2.6 Initialize Database
```powershell
# The database will be initialized automatically when the app starts
# But you can test the connection by running:
python -c "from database import init_db; init_db()"
```

---

## ⚛️ Step 3: Setup Frontend (React + Vite)

### 3.1 Navigate to Frontend Directory
```powershell
cd ..\frontend
```

### 3.2 Install Frontend Dependencies
```powershell
npm install
```

### 3.3 Create Environment File
```powershell
# Create .env file for frontend
@"
VITE_API_URL=http://localhost:8000
"@ | Out-File -Encoding UTF8 ".env"
```

---

## ▶️ Step 4: Run the Application

### 4.1 Start Backend Server
```powershell
# From backend directory (with venv activated)
cd backend
.\venv\Scripts\Activate.ps1

# Start the FastAPI server
python main.py

# Or using uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process
```

### 4.2 Start Frontend Development Server (New Terminal)
```powershell
# From frontend directory
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 4.3 Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 🧪 Testing the Application

### 1. Health Check
```powershell
# Test backend is running
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"Incident Report Analyzer","version":"1.0.0"}
```

### 2. Analyze an Incident
```powershell
$body = @{
    report_text = "A truck collided with a passenger vehicle at the intersection of Main and Oak Street during heavy rain. The truck driver failed to stop at the red light due to brake failure."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/analyze" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### 3. Get History
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/history" -Method Get
```

### 4. Get Analytics
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/analytics" -Method Get
```

---

## 📊 Project Structure

```
project-root/
├── backend/
│   ├── venv/                           # Python virtual environment
│   ├── .env                            # Environment variables (create this)
│   ├── .env.example                    # Example env file
│   ├── main.py                         # FastAPI application
│   ├── config.py                       # Configuration management
│   ├── database.py                     # Database connection
│   ├── models.py                       # SQLAlchemy models
│   ├── schemas.py                      # Pydantic schemas
│   ├── requirements.txt                # Python dependencies
│   ├── logs/                           # Application logs
│   ├── data/                           # FAISS index storage
│   └── services/
│       ├── embedding_service.py        # OpenAI embeddings
│       ├── llm_service.py              # OpenAI LLM
│       └── rag_service.py              # FAISS RAG
│
└── frontend/
    ├── node_modules/                   # Dependencies
    ├── .env                            # Environment variables
    ├── vite.config.js                  # Vite configuration
    ├── tailwind.config.js              # Tailwind CSS
    ├── package.json                    # NPM config
    ├── index.html                      # HTML entry point
    ├── public/                         # Static assets
    └── src/
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Root component
        ├── index.css                   # Global styles
        ├── App.css                     # App styles
        ├── services/
        │   └── api.js                  # API client
        ├── components/
        │   ├── IncidentForm.jsx        # Form component
        │   ├── AnalysisResult.jsx      # Results display
        │   ├── ReportHistory.jsx       # History component
        │   ├── Analytics.jsx           # Analytics component
        │   ├── LoadingSpinner.jsx      # Loading indicator
        │   └── SeverityBadge.jsx       # Severity display
        └── pages/
            └── Dashboard.jsx           # Main page
```

---

## 🔧 Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server: Connection refused
```
**Solution:**
1. Ensure PostgreSQL is running: `pg_isready -h localhost`
2. Check credentials in .env file
3. Verify database exists: `psql -U postgres -l`

### OpenAI API Key Error
```
Error: Invalid authentication with the OpenAI API
```
**Solution:**
1. Verify your API key at https://platform.openai.com/api-keys
2. Ensure it's correctly copied in .env
3. Check your OpenAI account has available credits

### Port Already in Use
```
Error: Address already in use
```
**Solution:**
1. Backend on different port:
   ```powershell
   python main.py --port 8001
   ```
2. Frontend on different port:
   ```powershell
   npm run dev -- --port 5174
   ```

### CORS Error in Browser
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. Check CORS_ORIGINS in backend .env
2. Update frontend .env with correct API URL
3. Restart both servers

### Module Not Found
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution:**
1. Activate virtual environment: `.\venv\Scripts\Activate.ps1`
2. Install requirements: `pip install -r requirements.txt`

---

## 📝 Usage Guide

### Analyze an Incident
1. Open http://localhost:5173 in your browser
2. Enter incident report text (minimum 10 characters)
3. Click "Analyze"
4. View results including:
   - Root Cause
   - Contributing Factors
   - Severity Level
   - Prevention Measures

### View History
- Click "History" tab to see all analyzed incidents
- Search and filter by date, severity, or keywords

### View Analytics
- Click "Analytics" tab for statistics
- See distribution of incidents by severity
- View total count and trends

---

## 🛑 Stopping the Application

### Stop Backend
```powershell
# In the backend terminal
Ctrl + C
```

### Stop Frontend
```powershell
# In the frontend terminal
Ctrl + C
```

### Deactivate Virtual Environment
```powershell
deactivate
```

---

## 📚 API Endpoints

### Analyze Incident
```
POST /api/analyze
Content-Type: application/json

{
  "report_text": "string (min 10 characters)"
}

Response:
{
  "id": 1,
  "report_text": "...",
  "analysis": {
    "root_cause": "...",
    "contributing_factors": ["..."],
    "severity": "High/Medium/Low/Critical",
    "prevention_measures": ["..."]
  },
  "similar_incidents": [2, 5],
  "created_at": "2026-03-03T10:00:00"
}
```

### Get History
```
GET /api/history?limit=20&offset=0

Response: Array of incidents
```

### Get Specific Incident
```
GET /api/incident/{incident_id}

Response: Incident details
```

### Get Analytics
```
GET /api/analytics

Response:
{
  "total_incidents": 10,
  "severity_distribution": {
    "Critical": 1,
    "High": 3,
    "Medium": 4,
    "Low": 2
  },
  "critical_count": 1,
  "high_count": 3,
  "medium_count": 4,
  "low_count": 2
}
```

### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "service": "Incident Report Analyzer",
  "version": "1.0.0"
}
```

---

## 🚀 Performance Tips

1. **Backend Performance**
   - Use PyPy for faster Python execution
   - Implement connection pooling (already done)
   - Consider Redis for caching

2. **Frontend Performance**
   - Build for production: `npm run build`
   - Run preview mode: `npm run preview`
   - Enable gzip compression

3. **Database Performance**
   - Add indexes to frequently queried columns
   - Use pagination for large result sets
   - Consider connection pooling limits

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review application logs in `backend/logs/app.log`
3. Check OpenAI API status at https://status.openai.com

---

**Happy coding! 🎉**
