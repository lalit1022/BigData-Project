# 📡 API Documentation - Email Classification System

Complete reference for all API endpoints used by the React frontend.

---

## 🌐 Base URL

```
Development: http://localhost:5000
Production:  https://your-api-domain.com
```

All endpoints are prefixed with `/api`

---

## 🔐 Authentication

Currently, the API does not require authentication. For production, implement:
- JWT tokens
- API keys
- OAuth 2.0

---

## 📋 API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | Fetch all classified emails |
| POST | `/api/classify` | Classify a single email |
| POST | `/api/pipeline` | Upload CSV and start Hadoop pipeline |
| GET | `/api/pipeline/:job_id` | Check pipeline processing status |
| GET | `/api/model/stats` | Get ML model performance statistics |

---

## 1. GET /api/emails

Retrieves all classified emails from MongoDB database.

### Request

```http
GET /api/emails HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

### Response

**Status:** `200 OK`

```json
[
  {
    "id": 1,
    "from": "sarah@company.com",
    "initials": "SC",
    "category": "Primary",
    "subject": "Q4 Budget Meeting",
    "preview": "Hi team, please review the agenda...",
    "time": "9:41 AM",
    "unread": true
  },
  {
    "id": 2,
    "from": "deals@amazon.com",
    "initials": "AM",
    "category": "Promotions",
    "subject": "Flash Sale - 50% OFF",
    "preview": "Don't miss our biggest sale...",
    "time": "8:30 AM",
    "unread": false
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique email identifier |
| `from` | string | Sender email address |
| `initials` | string | 2-letter initials for avatar |
| `category` | string | Classification: `Primary`, `Promotions`, `Social`, `Spam` |
| `subject` | string | Email subject line |
| `preview` | string | First ~100 characters of email body |
| `time` | string | Human-readable timestamp (e.g., "9:41 AM", "Yesterday") |
| `unread` | boolean | Whether email is unread |

### Error Responses

**Status:** `500 Internal Server Error`

```json
{
  "error": "Database connection failed"
}
```

### Usage in Frontend

```javascript
import { getAllEmails } from './api';

const emails = await getAllEmails();
console.log(emails); // Array of email objects
```

---

## 2. POST /api/classify

Classifies a single email using the trained ML model.

### Request

```http
POST /api/classify HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "from": "deals@shop.com",
  "subject": "Special Offer - 70% OFF",
  "body": "Limited time only! Get massive discounts on all products..."
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Sender email address |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Full email content |

### Response

**Status:** `200 OK`

```json
{
  "id": 12345,
  "from": "deals@shop.com",
  "initials": "DS",
  "category": "Promotions",
  "subject": "Special Offer - 70% OFF",
  "preview": "Limited time only! Get massive discounts...",
  "time": "Just now",
  "unread": true
}
```

### Error Responses

**Status:** `400 Bad Request`

```json
{
  "error": "Missing required field: subject"
}
```

**Status:** `500 Internal Server Error`

```json
{
  "error": "Classification model failed"
}
```

### Usage in Frontend

```javascript
import { classifyEmail } from './api';

const newEmail = await classifyEmail(
  'sender@example.com',
  'Meeting Tomorrow',
  'Let\'s discuss the project...'
);
console.log(newEmail.category); // "Primary"
```

---

## 3. POST /api/pipeline

Uploads a CSV file and starts the Hadoop MapReduce pipeline for bulk classification.

### Request

```http
POST /api/pipeline HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="emails.csv"
Content-Type: text/csv

from,subject,body
alice@work.com,Project Update,Here's the latest...
deals@store.com,Sale Alert,50% off everything...
------WebKitFormBoundary--
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | CSV file with columns: `from`, `subject`, `body` |

### CSV Format

```csv
from,subject,body
sender1@example.com,Subject line here,Full email body content here...
sender2@example.com,Another subject,Another email body...
```

**Requirements:**
- Must have headers: `from`, `subject`, `body`
- UTF-8 encoding
- Max file size: 100 MB (configurable)
- No empty rows

### Response

**Status:** `200 OK`

```json
{
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "started",
  "message": "Pipeline started successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string (UUID) | Unique identifier for tracking pipeline |
| `status` | string | Always `"started"` initially |
| `message` | string | Human-readable status message |

### Error Responses

**Status:** `400 Bad Request`

```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "Invalid CSV format: missing 'from' column"
}
```

**Status:** `413 Payload Too Large`

```json
{
  "error": "File size exceeds 100 MB limit"
}
```

### Usage in Frontend

```javascript
import { uploadCSV } from './api';

const file = document.querySelector('input[type="file"]').files[0];
const response = await uploadCSV(file);

console.log(response.job_id); // "a1b2c3d4-e5f6-7890..."
```

---

## 4. GET /api/pipeline/:job_id

Polls the status of a Hadoop pipeline job.

### Request

```http
GET /api/pipeline/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: localhost:5000
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | string (UUID) | Job ID returned from POST /api/pipeline |

### Response (In Progress)

**Status:** `200 OK`

```json
{
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "processing",
  "progress": 45,
  "total_emails": 5000,
  "processed_emails": 2250
}
```

### Response (Completed)

**Status:** `200 OK`

```json
{
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "done",
  "progress": 100,
  "total_emails": 5000,
  "processed_emails": 5000,
  "message": "Classification complete"
}
```

### Response (Failed)

**Status:** `200 OK`

```json
{
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "failed",
  "progress": 67,
  "error": "Hadoop job failed: OutOfMemoryError"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `status` | string | `"processing"`, `"done"`, or `"failed"` |
| `progress` | integer | Percentage complete (0-100) |
| `total_emails` | integer | Total emails in dataset |
| `processed_emails` | integer | Number processed so far |
| `message` | string | Status message (optional) |
| `error` | string | Error message if failed (optional) |

### Error Responses

**Status:** `404 Not Found`

```json
{
  "error": "Job not found"
}
```

### Usage in Frontend

The frontend automatically polls this endpoint every 2 seconds:

```javascript
import { getPipelineStatus } from './api';

const interval = setInterval(async () => {
  const status = await getPipelineStatus(jobId);
  
  if (status.status === 'done') {
    clearInterval(interval);
    // Fetch new emails
    const emails = await getAllEmails();
  }
}, 2000);
```

---

## 5. GET /api/model/stats

Retrieves machine learning model performance statistics.

### Request

```http
GET /api/model/stats HTTP/1.1
Host: localhost:5000
```

### Response

**Status:** `200 OK`

```json
{
  "accuracy": 0.94,
  "precision": 0.92,
  "recall": 0.91,
  "f1_score": 0.915,
  "total_trained": 50000,
  "last_updated": "2026-03-14T10:30:00Z",
  "categories": {
    "Primary": {
      "accuracy": 0.95,
      "precision": 0.94,
      "recall": 0.93,
      "f1_score": 0.935,
      "samples": 15000
    },
    "Promotions": {
      "accuracy": 0.93,
      "precision": 0.91,
      "recall": 0.90,
      "f1_score": 0.905,
      "samples": 12000
    },
    "Social": {
      "accuracy": 0.92,
      "precision": 0.90,
      "recall": 0.89,
      "f1_score": 0.895,
      "samples": 10000
    },
    "Spam": {
      "accuracy": 0.96,
      "precision": 0.95,
      "recall": 0.94,
      "f1_score": 0.945,
      "samples": 13000
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `accuracy` | float | Overall model accuracy (0.0-1.0) |
| `precision` | float | Overall precision score |
| `recall` | float | Overall recall score |
| `f1_score` | float | Overall F1 score |
| `total_trained` | integer | Total training samples |
| `last_updated` | string (ISO 8601) | Last model training date |
| `categories` | object | Per-category statistics |

### Error Responses

**Status:** `503 Service Unavailable`

```json
{
  "error": "Model statistics unavailable"
}
```

### Usage in Frontend

```javascript
import { getModelStats } from './api';

const stats = await getModelStats();
console.log(`Accuracy: ${(stats.accuracy * 100).toFixed(1)}%`);
```

---

## 🔧 Frontend API Module (`/src/app/api.js`)

### Complete Implementation

```javascript
const BASE_URL = 'http://localhost:5000';

// Helper function for fetch requests
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// 1. Get all emails
export async function getAllEmails() {
  return fetchAPI('/api/emails');
}

// 2. Classify single email
export async function classifyEmail(from, subject, body) {
  return fetchAPI('/api/classify', {
    method: 'POST',
    body: JSON.stringify({ from, subject, body }),
  });
}

// 3. Upload CSV file
export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BASE_URL}/api/pipeline`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser sets it with boundary
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload Error:', error);
    return null;
  }
}

// 4. Get pipeline status
export async function getPipelineStatus(jobId) {
  return fetchAPI(`/api/pipeline/${jobId}`);
}

// 5. Get model statistics
export async function getModelStats() {
  return fetchAPI('/api/model/stats');
}
```

---

## 🧪 Testing with cURL

### Test All Endpoints

```bash
# 1. Get emails
curl http://localhost:5000/api/emails

# 2. Classify email
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test Subject",
    "body": "This is a test email body"
  }'

# 3. Upload CSV
curl -X POST http://localhost:5000/api/pipeline \
  -F "file=@emails.csv"

# 4. Check pipeline status
curl http://localhost:5000/api/pipeline/<job_id>

# 5. Get model stats
curl http://localhost:5000/api/model/stats
```

---

## 📊 Rate Limiting (Recommended for Production)

Implement rate limiting on the backend:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/classify', methods=['POST'])
@limiter.limit("10 per minute")
def classify_email():
    # ... implementation
```

---

## 🔒 Security Best Practices

1. **HTTPS Only** in production
2. **CORS** - Whitelist specific origins:
   ```python
   CORS(app, origins=['https://your-frontend.com'])
   ```
3. **Input Validation** - Sanitize all inputs
4. **File Upload Limits** - Max 100 MB
5. **Authentication** - JWT tokens or API keys
6. **Rate Limiting** - Prevent abuse

---

## 📈 Monitoring & Logging

Track API usage:

```python
import logging

logging.basicConfig(level=logging.INFO)

@app.before_request
def log_request():
    logging.info(f'{request.method} {request.path} - {request.remote_addr}')
```

---

## 🌍 CORS Configuration

For production, configure CORS properly:

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-frontend.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

---

## 📝 Changelog

### Version 1.0.0 (2026-03-14)
- Initial API release
- All 5 core endpoints implemented
- MongoDB integration
- Hadoop pipeline support

---

**For issues or questions, refer to README.md or open a GitHub issue.**
