#!/bin/bash
# run.sh - Start the Incident Report Analyzer

set -e

echo "========================================="
echo "  Incident Report Analyzer"
echo "  AI-Powered Transportation Safety"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "   Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found"
    echo "   Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your OpenAI API key:"
    echo "   nano backend/.env"
    echo ""
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=sk-" backend/.env; then
    echo "❌ OPENAI_API_KEY not properly set in backend/.env"
    echo "   Please edit backend/.env and add your API key"
    echo "   Get key from: https://platform.openai.com/api-keys"
    exit 1
fi

echo "✅ Environment setup verified"
echo ""

# Start services
echo "Starting services..."
echo ""

docker-compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "========================================="
    echo "  🎉 Ready to Use!"
    echo "========================================="
    echo ""
    echo "Frontend:  http://localhost"
    echo "Backend:   http://localhost:8000"
    echo "API Docs:  http://localhost:8000/docs"
    echo ""
    echo "Database:  PostgreSQL on localhost:5432"
    echo ""
    echo "========================================="
    echo ""
    echo "📝 First Steps:"
    echo "  1. Open http://localhost in your browser"
    echo "  2. Enter an incident report"
    echo "  3. Click 'Analyze Report'"
    echo ""
    echo "📊 View Logs:"
    echo "  docker-compose logs -f backend"
    echo "  docker-compose logs -f frontend"
    echo ""
    echo "🛑 Stop Services:"
    echo "  docker-compose down"
    echo ""
else
    echo "❌ Failed to start services"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check Docker is running"
    echo "  - Check ports 80, 8000, 5432 are available"
    echo "  - View logs: docker-compose logs"
    exit 1
fi
