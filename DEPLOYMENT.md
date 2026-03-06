# Deployment Guide

Complete deployment instructions for Incident Report Analyzer.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment (EC2)](#aws-deployment-ec2)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Environment Setup](#environment-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Database Backups](#database-backups)
8. [Scaling](#scaling)

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Git

### Backend Setup

```bash
# Clone repository
git clone <repo-url>
cd incident-report-analyzer/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update OPENAI_API_KEY in .env

# Initialize database
python -c "from database import init_db; init_db()"

# Run development server
python -m uvicorn main:app --reload
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Access at: http://localhost:5173

## Docker Deployment

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd incident-report-analyzer

# Create .env for backend
cp backend/.env.example backend/.env

# Update OPENAI_API_KEY
nano backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service URLs
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### Rebuild Images

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose build backend --no-cache
docker-compose up -d backend
```

## AWS Deployment (EC2)

### Step 1: Launch EC2 Instance

```bash
# Recommended Configuration:
# - AMI: Ubuntu 22.04 LTS
# - Instance Type: t3.medium (2 vCPU, 4 GB RAM)
# - Storage: 30 GB gp3
# - Security Group: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### Step 2: Install Docker

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone <repo-url>
cd incident-report-analyzer

# Create .env
cp backend/.env.example backend/.env
nano backend/.env  # Set OPENAI_API_KEY and other values

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf with SSL configuration
# Then restart containers
docker-compose restart frontend
```

### Step 5: Setup Reverse Proxy (Optional)

Use AWS Application Load Balancer (ALB):
1. Create ALB in AWS Console
2. Configure target groups for port 80
3. Attach EC2 instance to target group
4. Update security group rules

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Setup cluster (using EKS, GKE, or local kind)
kubectl cluster-info
```

### Create Namespace

```bash
kubectl create namespace incident-analyzer
kubectl config set-context --current --namespace=incident-analyzer
```

### Create Secrets

```bash
kubectl create secret generic openai-credentials \
  --from-literal=api-key=sk-your-key-here \
  -n incident-analyzer

kubectl create secret generic db-credentials \
  --from-literal=username=incident_user \
  --from-literal=password=your-secure-password \
  -n incident-analyzer
```

### Deploy PostgreSQL

```yaml
# postgres-deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: POSTGRES_DB
          value: incident_analyzer_db
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

### Deploy Backend

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: incident-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: postgresql://incident_user:password@postgres:5432/incident_analyzer_db
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-credentials
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
```

### Deploy Frontend

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: incident-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          value: http://backend-service:8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Deploy

```bash
# Build and push images to registry
docker build -t your-registry/incident-backend:latest backend/
docker build -t your-registry/incident-frontend:latest frontend/
docker push your-registry/incident-backend:latest
docker push your-registry/incident-frontend:latest

# Update image references in YAML files, then deploy
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

## Environment Setup

### Development Environment

```bash
# .env.development
DEBUG=True
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
MIN_SIMILARITY_SCORE=0.3  # Lower for testing
```

### Staging Environment

```bash
# .env.staging
DEBUG=False
LOG_LEVEL=INFO
CORS_ORIGINS=["https://staging.example.com"]
MIN_SIMILARITY_SCORE=0.5
```

### Production Environment

```bash
# .env.production
DEBUG=False
LOG_LEVEL=WARNING
CORS_ORIGINS=["https://example.com"]
MIN_SIMILARITY_SCORE=0.6
OPENAI_MODEL=gpt-4-turbo  # Use turbo for better performance
```

## Monitoring & Logging

### Application Logs

```bash
# View backend logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f

# Show last 100 lines
docker-compose logs --tail=100 backend
```

### Database Monitoring

```bash
# Connect to database
PGPASSWORD=incident_password psql -h localhost -U incident_user -d incident_analyzer_db

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### Setup ELK Stack (Optional)

```yaml
# docker-compose with ELK
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.0.0
    volumes:
      - ./backend/logs:/logs
```

## Database Backups

### Auto Backup Script

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="incident_analyzer_db"
DB_USER="incident_user"
DB_HOST="localhost"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump \
  -U $DB_USER \
  -d $DB_NAME \
  > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t backup_*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh >> /var/log/backup.log 2>&1
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T postgres psql -U incident_user -d incident_analyzer_db < backups/backup_20260302_020000.sql
```

## Scaling

### Horizontal Scaling

#### Backend Scaling

```bash
# Update docker-compose.yml replicas
docker-compose up -d --scale backend=3

# Or use load balancer
docker-compose exec -T backend service haproxy reload
```

#### Kubernetes Auto-scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Scaling

```yaml
# Update resource limits in deployment
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Database Connection Pooling

```python
# Update backend/database.py
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,        # Increase for more concurrent connections
    max_overflow=40,     # Additional connections allowed
    pool_pre_ping=True   # Validate connections
)
```

## Troubleshooting Deployment

### Issue: High Memory Usage

```bash
# Check container memory
docker stats

# Solution: Increase swap or upgrade instance
docker-compose down
# Upgrade EC2 instance type
# Restart services
docker-compose up -d
```

### Issue: Slow API Responses

```bash
# Check PostgreSQL slow queries
docker-compose exec postgres psql -U incident_user -d incident_analyzer_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Add indexes if needed
docker-compose exec postgres psql -U incident_user -d incident_analyzer_db -c "CREATE INDEX idx_severity ON incidents((analysis->>'severity'));"
```

### Issue: FAISS Index Corruption

```bash
# Rebuild FAISS index from database
docker-compose exec backend python -c "
from models import Incident
from database import SessionLocal
from services.rag_service import rag_service
db = SessionLocal()
incidents = db.query(Incident).all()
rag_service.rebuild_index_from_db([(i.id, i.embedding, i.report_text, i.analysis) for i in incidents])
"
```

## Performance Optimization

### Frontend Optimization

```bash
# Build with optimization
npm run build

# Analyze bundle
npm install -D rollup-plugin-visualizer
npm run build:analyze
```

### Backend Optimization

```python
# Enable async queries
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine("postgresql+asyncpg://...", echo=False)

# Add caching
from functools import lru_cache
@lru_cache(maxsize=1000)
def expensive_operation():
    pass
```

---

For more help, check logs and API documentation.
