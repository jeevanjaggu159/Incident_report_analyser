# Incident Report Analyzer

A full-stack Gen AI application for analyzing transportation incident reports using retrieval-augmented generation (RAG), embeddings, and large language models.

## Overview

**Incident Report Analyzer** is an enterprise-grade application that leverages AI to automatically analyze accident and incident reports in the transportation domain. It uses:

- **Frontend**: React with Vite and Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL for storing incidents and analyses
- **Vector Database**: FAISS for efficient similarity search
- **LLM**: OpenAI GPT-4 for intelligent analysis
- **Embeddings**: OpenAI text-embedding-3-small for semantic search

## Features

### Core Features
✅ **AI-Powered Analysis**: Automatic incident analysis with structured outputs  
✅ **RAG System**: Retrieval-augmented generation using FAISS for context awareness  
✅ **Vector Embeddings**: Semantic search to find similar past incidents  
✅ **Structured Output**: JSON-formatted analysis with:
  - Root cause analysis
  - Contributing factors
  - Severity assessment
  - Prevention measures

### User Interface
✅ **Modern Dashboard**: Clean, responsive React interface  
✅ **Severity Color Coding**: Visual indicators for incident severity  
✅ **Report History**: Browse and review all analyzed incidents  
✅ **Analytics Dashboard**: Severity distribution and statistics  
✅ **Loading States**: Smooth user experience with loading indicators  

### Backend Features
✅ **REST API**: Comprehensive endpoints with full documentation  
✅ **Error Handling**: Robust error management and validation  
✅ **Logging**: Detailed application and request logging  
✅ **CORS Support**: Secure cross-origin requests  
✅ **Connection Pooling**: Optimized database connections  

### DevOps
✅ **Docker Support**: Complete containerization with docker-compose  
✅ **Health Checks**: Service health monitoring  
✅ **Environment Management**: Flexible configuration via .env  
✅ **Production Ready**: Optimized for deployment  

## Project Structure

```
incident-report-analyzer/
├── backend/
│   ├── services/
│   │   ├── embedding_service.py      # OpenAI embeddings
│   │   ├── llm_service.py            # GPT analysis
│   │   └── rag_service.py            # FAISS retrieval
│   ├── main.py                        # FastAPI application
│   ├── models.py                      # SQLAlchemy ORM models
│   ├── schemas.py                     # Pydantic validation
│   ├── database.py                    # Database setup
│   ├── config.py                      # Configuration
│   ├── requirements.txt                # Python dependencies
│   ├── Dockerfile                      # Backend container
│   └── .env.example                    # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IncidentForm.jsx       # Report input form
│   │   │   ├── AnalysisResult.jsx     # Results display
│   │   │   ├── ReportHistory.jsx      # History table
│   │   │   ├── Analytics.jsx          # Statistics
│   │   │   ├── LoadingSpinner.jsx     # Loading indicator
│   │   │   └── SeverityBadge.jsx      # Status badge
│   │   ├── pages/
│   │   │   └── Dashboard.jsx          # Main page
│   │   ├── services/
│   │   │   └── api.js                 # API client
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Root component
│   │   └── index.css                  # Global styles
│   ├── package.json                   # NPM dependencies
│   ├── vite.config.js                 # Vite config
│   ├── tailwind.config.js             # Tailwind setup
│   ├── postcss.config.js              # PostCSS config
│   ├── index.html                     # HTML template
│   ├── Dockerfile                     # Frontend container
│   └── nginx.conf                     # Nginx config
│
├── docker-compose.yml                 # Docker orchestration
├── README.md                          # This file
├── DEPLOYMENT.md                      # Deployment guide
└── .gitignore                         # Git exclusions
```

## Prerequisites

- **Docker & Docker Compose** (recommended) or:
  - Python 3.11+
  - Node.js 18+
  - PostgreSQL 15+

- **OpenAI API Key** (from https://platform.openai.com/api-keys)

## Quick Start (Docker)

### 1. Clone Repository
```bash
cd incident-report-analyzer
```

### 2. Create Environment File
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and update:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Start Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- FastAPI backend on port 8000
- React frontend on port 80

### 4. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Stop Services
```bash
docker-compose down
```

## Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database (create .env file first with DB_URL)
python -c "from database import init_db; init_db()"

# Run server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/incident_analyzer_db

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# FAISS
FAISS_INDEX_PATH=./data/faiss_index.bin
FAISS_METADATA_PATH=./data/faiss_metadata.pkl

# Application
DEBUG=True
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# RAG
RAG_TOP_K=3
MIN_SIMILARITY_SCORE=0.5
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Incident Analysis
```bash
POST /api/analyze
Content-Type: application/json

{
  "report_text": "A truck collided with a car at Main Street..."
}
```

**Response**:
```json
{
  "id": 1,
  "report_text": "...",
  "analysis": {
    "root_cause": "Driver distraction",
    "contributing_factors": ["Poor visibility", "Speed"],
    "severity": "High",
    "prevention_measures": ["Driver training"]
  },
  "similar_incidents": [2, 5],
  "created_at": "2026-03-02T10:30:00"
}
```

### Get History
```bash
GET /api/history?limit=20&offset=0
```

### Get Specific Incident
```bash
GET /api/incident/{incident_id}
```

### Get Analytics
```bash
GET /api/analytics
```

### Health Check
```bash
GET /health
```

For full API documentation, visit: `http://localhost:8000/docs`

## How RAG Works

1. **Embedding Generation**: New incident report is converted to vector embedding using OpenAI API
2. **Similarity Search**: FAISS searches for top 3 similar incidents from history
3. **Context Enhancement**: Similar incidents are included in LLM prompt
4. **Analysis Generation**: GPT-4 generates improved analysis using historical context
5. **Storage**: Results stored in PostgreSQL and FAISS index updated

```
Report → Embedding → FAISS Search → Similar Incidents 
  ↓
LLM (with context) → Analysis → Database + FAISS Index
```

## Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 18.2.0 |
| Build Tool | Vite | 5.0.2 |
| Styling | Tailwind CSS | 3.3.6 |
| Backend API | FastAPI | 0.104.1 |
| ORM | SQLAlchemy | 2.0.23 |
| Database | PostgreSQL | 15 |
| Vector DB | FAISS | 1.7.4 |
| LLM | OpenAI GPT-4 | Latest |
| HTTP Client | Axios | 1.6.2 |
| Container | Docker | Latest |

## Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Pydantic validates all inputs
- **API Errors**: HTTP exceptions with descriptive messages
- **Database Errors**: Transaction rollback and logging
- **LLM Errors**: Graceful fallback with error messages
- **FAISS Errors**: Empty results returned safely

## Logging

Logs are written to:
- **Console**: Real-time debugging
- **File**: `backend/logs/app.log`

Log levels can be configured via `LOG_LEVEL` environment variable.

## Performance Considerations

- **Connection Pooling**: SQLAlchemy uses connection pool (size=20)
- **FAISS Indexing**: L2 distance enables fast similarity search
- **OpenAI Caching**: Embeddings cached in FAISS to reduce API calls
- **Frontend Optimization**: Vite minification and code splitting
- **Nginx Caching**: Static assets cached for 1 year

## Security

- **CORS**: Configured for specific origins
- **Input Validation**: Pydantic schemas enforce constraints
- **SQL Injection**: SQLAlchemy parameterized queries
- **API Keys**: Environment-based configuration
- **HTTPS**: Ready for SSL/TLS in production

## Troubleshooting

### Backend Connection Error
```
Issue: Frontend can't connect to backend
Solution: Ensure backend is running on 8000
$ python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Database Connection Error
```
Issue: Can't connect to PostgreSQL
Solution: Check DATABASE_URL in .env and PostgreSQL is running
$ psql -U incident_user -d incident_analyzer_db -c "SELECT 1"
```

### OpenAI API Error
```
Issue: "Invalid API key"
Solution: Check OPENAI_API_KEY in .env is valid
```

### FAISS Index Error
```
Issue: "FAISS index not found"
Solution: Create data/ directory or let app auto-create
$ mkdir -p backend/data
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- AWS deployment instructions
- Kubernetes setup
- Environment scaling
- Monitoring and logging
- Database backups

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Push and create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review API documentation: http://localhost:8000/docs
3. Check application logs: `backend/logs/app.log`
4. Submit an issue on GitHub

## Author

Built with ❤️ for transportation safety  
Generation Date: March 2, 2026

---

**Happy Analyzing! 🚗📊**
