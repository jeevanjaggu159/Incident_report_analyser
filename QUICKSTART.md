# Quick Start - Incident Report Analyzer (Local)

## 🚀 Get Running in 5 Minutes (Windows)

### Prerequisites Checklist
- ✅ Python 3.9+ ([Download](https://www.python.org/downloads/))
- ✅ PostgreSQL ([Download](https://www.postgresql.org/download/))
- ✅ Node.js ([Download](https://nodejs.org/))
- ✅ OpenAI API Key ([Get here](https://platform.openai.com/api-keys))

### Step 1: Run Setup Script
```powershell
# Open PowerShell in the project directory
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

### Step 2: Configure Environment
```
Edit: backend\.env

Update:
  OPENAI_API_KEY=sk-your-actual-api-key-here
  DATABASE_URL=postgresql://postgres:your_password@localhost:5432/incident_db
```

### Step 3: Start Application
```cmd
run.bat
```

This opens two terminal windows:
- Backend running on http://localhost:8000
- Frontend running on http://localhost:5173

### Step 4: Access
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## 📝 Manual Setup (If Preferred)
# API Docs: http://localhost:8000/docs
```

#### Test
```bash
# Check backend is running
curl http://localhost:8000/health

# Check frontend is accessible
curl http://localhost
```

#### Stop
```bash
docker-compose down
```

---

### Option 2: Local Development

#### Prerequisites
- Python 3.11+ and Node.js 18+
- PostgreSQL 15+ running on localhost:5432
- OpenAI API key

#### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux  
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL (your PostgreSQL connection)
# - OPENAI_API_KEY (your API key)

# Initialize database
python -c "from database import init_db; init_db()"

# Run server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at: http://localhost:8000

#### Frontend Setup (new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be running at: http://localhost:5173

---

## 📝 First Test

Once everything is running:

1. **Open** http://localhost (Docker) or http://localhost:5173 (Local)

2. **Try this test report:**
```
On March 2, 2026, at 10:30 AM, a delivery truck failed to yield at a red light 
and collided with a passenger car at the intersection of Main Street and Oak Avenue. 
The truck driver was distracted by his mobile phone. Weather was clear but visibility 
was reduced due to the sun's angle. The truck was traveling at 45 km/h in a 40 km/h zone. 
The passenger car occupants sustained minor injuries. Both vehicles required towing.
```

3. **Click** "Analyze Report"

4. **View** the structured analysis with:
   - Root Cause
   - Contributing Factors
   - Severity Level
   - Prevention Measures

5. **Check** History and Analytics tabs

---

## 🔧 Common Commands

### Docker
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild images
docker-compose build --no-cache

# Remove everything
docker-compose down -v
```

### Backend
```bash
# Format code
black .

# Run linting
flake8 .

# Run tests (if added)
pytest
```

### Frontend
```bash
# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📚 API Quick Reference

### Analyze Incident
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"report_text": "A truck collided with car..."}'
```

### Get History
```bash
curl http://localhost:8000/api/history?limit=10
```

### Get Analytics
```bash
curl http://localhost:8000/api/analytics
```

### Health Check
```bash
curl http://localhost:8000/health
```

---

## 🆘 Troubleshooting

### Issue: Port Already in Use
```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000
# macOS/Linux
lsof -i :8000

# Kill process (get PID from above)
# Windows
taskkill /PID <PID> /F
# macOS/Linux
kill -9 <PID>
```

### Issue: Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check DATABASE_URL in .env is correct
```

### Issue: OpenAI API Error
```bash
# Verify API key is valid
# Test with Python:
import openai
openai.api_key = "your-key"
response = openai.ChatCompletion.create(model="gpt-4", messages=[{"role": "user", "content": "test"}])
print(response)
```

### Issue: FAISS Error
```bash
# Create data directory
mkdir -p backend/data

# Restart backend
docker-compose restart backend
```

### Issue: Frontend Can't Connect to Backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS is enabled
# Open backend/config.py and verify CORS_ORIGINS includes frontend URL

# Restart backend
docker-compose restart backend
```

---

## 📖 Additional Resources

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOYMENT.md
- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
- **Backend Code**: See backend/main.py
- **Frontend Code**: See frontend/src/pages/Dashboard.jsx

---

## 💡 Tips

1. **Use docker-compose logs** to debug issues quickly
2. **Check http://localhost:8000/docs** for full API documentation
3. **Set RAG_TOP_K=5** in .env to find more similar incidents
4. **Set MIN_SIMILARITY_SCORE=0.3** for more results (0.5 is default)
5. **Use proper-casing in severity**: Critical, High, Medium, Low

---

## 🎯 Next Steps

1. ✅ Get the application running
2. ✅ Test with sample incident reports
3. 📖 Read the full documentation
4. 🚀 Deploy to production (see DEPLOYMENT.md)
5. 📊 Monitor analytics and refine

---

**Need Help?**
- Check logs: `docker-compose logs -f`
- Read README.md for complete details
- Review DEPLOYMENT.md for production setup

Happy analyzing! 🚗📊
