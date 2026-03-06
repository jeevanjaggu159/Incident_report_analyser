# API Reference

Complete API documentation for Incident Report Analyzer.

## Base URL

```
http://localhost:8000
```

## Authentication

Current implementation does not require authentication. For production, consider adding:
- OAuth 2.0
- API Key authentication
- JWT bearer tokens

## Response Format

All responses are in JSON format with consistent structure:

### Success Response (2xx)
```json
{
  "data": {},
  "status": "success"
}
```

### Error Response (4xx, 5xx)
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

## Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Description**: Check if the API is running

**Response** (200):
```json
{
  "status": "healthy",
  "service": "Incident Report Analyzer",
  "version": "1.0.0"
}
```

**curl Example**:
```bash
curl http://localhost:8000/health
```

---

### 2. Analyze Incident

**Endpoint**: `POST /api/analyze`

**Description**: Submit an incident report for AI analysis

**Request Body**:
```json
{
  "report_text": "On March 2, 2026, at 10:30 AM, a truck collided with a car at Main Street..."
}
```

**Query Parameters**: None

**Response** (200):
```json
{
  "id": 1,
  "report_text": "On March 2, 2026...",
  "analysis": {
    "root_cause": "Driver distraction due to mobile phone use",
    "contributing_factors": [
      "Reduced visibility due to sun angle",
      "Excessive speed (45 km/h in 40 km/h zone)",
      "Delayed reaction time"
    ],
    "severity": "High",
    "prevention_measures": [
      "Enhanced driver training on distraction management",
      "Installation of dash cameras to monitor driver behavior",
      "Implement speed monitoring systems",
      "Regular vehicle maintenance checks"
    ]
  },
  "similar_incidents": [2, 5, 8],
  "created_at": "2026-03-02T10:30:00"
}
```

**Errors**:
- `400`: Invalid report text (too short, too long, or empty)
- `500`: Analysis failed

**curl Example**:
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "report_text": "A truck collided with a car at intersection..."
  }'
```

**Python Example**:
```python
import requests

response = requests.post(
    'http://localhost:8000/api/analyze',
    json={'report_text': 'A truck collided...'},
    headers={'Content-Type': 'application/json'}
)
result = response.json()
print(f"Analysis: {result['analysis']}")
```

---

### 3. Get Analysis History

**Endpoint**: `GET /api/history`

**Description**: Retrieve list of previously analyzed incidents

**Query Parameters**:
- `limit` (optional, default: 20, max: 100) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip (for pagination)

**Response** (200):
```json
[
  {
    "id": 1,
    "report_text": "A truck collided with...",
    "severity": "High",
    "root_cause": "Driver distraction",
    "created_at": "2026-03-02T10:30:00"
  },
  {
    "id": 2,
    "report_text": "A bus braked suddenly...",
    "severity": "Medium",
    "root_cause": "Pedestrian interference",
    "created_at": "2026-03-01T14:15:00"
  }
]
```

**curl Example**:
```bash
# Get last 10
curl http://localhost:8000/api/history?limit=10

# Get with pagination
curl http://localhost:8000/api/history?limit=20&offset=20
```

**Python Example**:
```python
import requests

response = requests.get(
    'http://localhost:8000/api/history',
    params={'limit': 10, 'offset': 0}
)
incidents = response.json()
for incident in incidents:
    print(f"ID: {incident['id']}, Severity: {incident['severity']}")
```

---

### 4. Get Specific Incident

**Endpoint**: `GET /api/incident/{incident_id}`

**Description**: Get detailed information about a specific incident

**Path Parameters**:
- `incident_id` (required) - ID of the incident

**Response** (200):
```json
{
  "id": 1,
  "report_text": "On March 2, 2026, at 10:30 AM, a truck collided...",
  "analysis": {
    "root_cause": "Driver distraction",
    "contributing_factors": ["Poor visibility", "Speed"],
    "severity": "High",
    "prevention_measures": ["Driver training", "Speed reduction"]
  },
  "similar_incidents": [2, 5],
  "created_at": "2026-03-02T10:30:00"
}
```

**Errors**:
- `404`: Incident not found
- `500`: Server error

**curl Example**:
```bash
curl http://localhost:8000/api/incident/1
```

**Python Example**:
```python
import requests

response = requests.get('http://localhost:8000/api/incident/1')
incident = response.json()
print(f"Root Cause: {incident['analysis']['root_cause']}")
```

---

### 5. Get Analytics

**Endpoint**: `GET /api/analytics`

**Description**: Get statistics about all analyzed incidents

**Query Parameters**: None

**Response** (200):
```json
{
  "total_incidents": 45,
  "severity_distribution": {
    "Critical": 2,
    "High": 18,
    "Medium": 20,
    "Low": 5
  },
  "critical_count": 2,
  "high_count": 18,
  "medium_count": 20,
  "low_count": 5
}
```

**curl Example**:
```bash
curl http://localhost:8000/api/analytics
```

**Python Example**:
```python
import requests

response = requests.get('http://localhost:8000/api/analytics')
stats = response.json()
print(f"Total Incidents: {stats['total_incidents']}")
print(f"Critical: {stats['critical_count']}")
print(f"Distribution: {stats['severity_distribution']}")
```

---

## Severity Levels

Incidents are classified into four severity levels:

| Level | Code | Description | Example |
|-------|------|-------------|---------|
| Critical | 🚨 | Fatalities or major injuries | Multiple casualties, major injuries |
| High | ⚠️ | Injuries present | Broken bones, hospital admission needed |
| Medium | ⚡ | Property damage or minor injuries | Bruises, minor cuts, vehicle damage |
| Low | ✓ | Near-miss, no injuries | No impact, no injuries |

## Data Types

### AnalysisRequest
```typescript
{
  report_text: string  // 10-5000 characters
}
```

### AnalysisResult
```typescript
{
  root_cause: string,
  contributing_factors: string[],
  severity: "Critical" | "High" | "Medium" | "Low",
  prevention_measures: string[]
}
```

### AnalysisResponse
```typescript
{
  id: number,
  report_text: string,
  analysis: AnalysisResult,
  similar_incidents: number[],
  created_at: string  // ISO 8601 datetime
}
```

### IncidentHistory
```typescript
{
  id: number,
  report_text: string,
  severity: string,
  root_cause: string,
  created_at: string  // ISO 8601 datetime
}
```

### AnalyticsData
```typescript
{
  total_incidents: number,
  severity_distribution: {
    Critical: number,
    High: number,
    Medium: number,
    Low: number
  },
  critical_count: number,
  high_count: number,
  medium_count: number,
  low_count: number
}
```

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input (e.g., empty report text) |
| 404 | Not Found | Incident or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error during processing |
| 503 | Service Unavailable | Service temporarily down |

## Rate Limiting

No rate limiting currently implemented. For production, consider:
- 10 requests per minute per IP
- 100 requests per hour per authenticated user
- Adaptive rate limiting based on server load

## Pagination

Pagination is supported on `/api/history` endpoint:

```
GET /api/history?limit=20&offset=40
```

- Returns records 40-60 (20 items, starting from offset 40)
- Max limit: 100
- Default limit: 20
- Always returns items in DESC order by created_at

## Interactive Documentation

Full interactive API documentation available at:

```
http://localhost:8000/docs
```

This provides:
- Interactive endpoint testing
- Request/response examples
- Schema validation
- Auto-generated code samples

Also available (alternative format):
```
http://localhost:8000/redoc
```

## Common Use Cases

### Analyze Multiple Reports
```python
import requests
import time

reports = [
    "A truck collided with a car...",
    "A bus braked suddenly...",
    "A motorcycle hit a barrier..."
]

for report in reports:
    response = requests.post(
        'http://localhost:8000/api/analyze',
        json={'report_text': report}
    )
    
    if response.status_code == 200:
        analysis = response.json()
        print(f"Severity: {analysis['analysis']['severity']}")
    else:
        print(f"Error: {response.json()}")
    
    time.sleep(1)  # Avoid rate limiting
```

### Get Severity Statistics
```python
import requests

response = requests.get('http://localhost:8000/api/analytics')
stats = response.json()

for severity, count in stats['severity_distribution'].items():
    percentage = (count / stats['total_incidents'] * 100)
    print(f"{severity}: {count} ({percentage:.1f}%)")
```

### Export Incident Data
```python
import requests
import csv

response = requests.get('http://localhost:8000/api/history?limit=100')
incidents = response.json()

with open('incidents.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['ID', 'Root Cause', 'Severity', 'Date'])
    
    for incident in incidents:
        writer.writerow([
            incident['id'],
            incident['root_cause'],
            incident['severity'],
            incident['created_at']
        ])
```

---

For more information, see README.md and QUICKSTART.md
