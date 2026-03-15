# Email Classification App - Data Flow

## State Management Overview

The application uses a **mock-to-real data flow** where users initially see sample emails, then real classified emails from MongoDB after the pipeline completes.

## React State Structure

```javascript
// App.jsx
const [emails, setEmails] = useState(MOCK_EMAILS)        // Start with 8 sample emails
const [isRealData, setIsRealData] = useState(false)      // Tracks data source
const [pipelineRunning, setPipelineRunning] = useState(false)
const [pipelineJobId, setPipelineJobId] = useState(null)
```

## Data Flow Stages

### Stage 1: Initial Load (Mock Data)
```
App mounts
  └─> useState(MOCK_EMAILS)
  └─> isRealData = false
  └─> Sidebar shows "Sample Data" badge
  └─> Header shows "8 emails (sample)"
  └─> Category counts calculated from mock array
```

### Stage 2: User Uploads CSV
```
User clicks "Upload dataset"
  └─> BottomPanel opens with "Bulk dataset upload" tab
  └─> User selects CSV file
  └─> handleFileSelect() triggers
      ├─> onPipelineStart() → setPipelineRunning(true)
      ├─> POST /api/pipeline (uploads file to Flask)
      ├─> Response: { job_id: "xxx", status: "started" }
      └─> setPipelineJobId(job_id)
```

### Stage 3: Pipeline Running
```
useEffect(() => {
  if (!pipelineRunning) return
  
  const interval = setInterval(async () => {
    // Poll Flask every 2 seconds
    const status = await getPipelineStatus(pipelineJobId)
    
    if (status.status === 'done') {
      clearInterval(interval)
      setPipelineRunning(false)
      
      // KEY MOMENT: Fetch real emails
      const realEmails = await getAllEmails()
      setEmails(realEmails)      // Replace mock with real
      setIsRealData(true)        // Update UI indicators
    }
  }, 2000)
}, [pipelineRunning, pipelineJobId])
```

### Stage 4: Real Data Loaded
```
getAllEmails() response
  └─> GET /api/emails returns MongoDB data
  └─> setEmails(realEmails)  [12,867 emails]
  └─> setIsRealData(true)
  
UI Updates:
  ├─> Sidebar: "Live Data" badge (green, pulsing)
  ├─> Header: "12,867 emails classified"
  ├─> Footer: "MongoDB Backend"
  └─> Category counts recalculated from real data
```

## API Endpoints Used

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/classify` | POST | Classify single email | `{ category, confidence }` |
| `/api/pipeline` | POST | Upload CSV file | `{ job_id, status }` |
| `/api/pipeline/status` | GET | Poll pipeline progress | `{ status, current_step, progress }` |
| `/api/emails` | GET | Fetch all emails from MongoDB | `Array<Email>` |
| `/api/model/stats` | GET | Model performance metrics | `{ accuracy, precision, ... }` |

## File Structure

```
src/app/
├── components/
│   ├── Sidebar.jsx          → Shows data source indicator
│   ├── EmailList.jsx        → Renders emails array
│   ├── EmailRow.jsx         → Individual email card
│   ├── BottomPanel.jsx      → Modal with tabs
│   ├── ClassifySingle.jsx   → Single email form
│   ├── BulkUpload.jsx       → CSV upload + pipeline status
│   ├── PipelineStatus.jsx   → 4-step progress visualization
│   └── ModelStats.jsx       → Confusion matrix modal
├── App.jsx                  → Main state management
└── api.js                   → All fetch() calls
```

## Key Functions

### `calculateCategoryCounts(emails)`
Dynamically calculates category counts from current email array:
- Works with both mock and real data
- Updates automatically when emails state changes
- Returns: `{ all: 8, Primary: 2, Promotions: 2, Social: 2, Spam: 2 }`

### `handlePipelineComplete(jobId)`
Called when BulkUpload finishes:
- Sets pipelineJobId
- Triggers useEffect polling loop
- Eventually fetches real emails from MongoDB

### `getAllEmails()`
Fetches real classified emails:
- Called only after pipeline status = 'done'
- Returns full email array from MongoDB
- Replaces mock data in state

## Visual Indicators

| Indicator | Location | Condition | Color |
|-----------|----------|-----------|-------|
| "Sample Data" badge | Header | `!isRealData` | Amber |
| "Pipeline Running..." | Header | `pipelineRunning` | Blue (pulsing) |
| "Sample Data" status | Sidebar footer | `!isRealData` | Amber dot |
| "Live Data" status | Sidebar footer | `isRealData` | Green dot (pulsing) |
| Footer text | Footer | `isRealData` | "MongoDB Backend" vs "Mock Data" |

## Expected Backend Response Format

### GET /api/emails
```json
[
  {
    "id": "ObjectId or UUID",
    "from": "sender@example.com",
    "subject": "Email subject",
    "body": "Email body text",
    "category": "Primary|Promotions|Social|Spam",
    "timestamp": "2026-03-14T10:30:00Z",
    "confidence": 0.95
  },
  ...
]
```

### GET /api/pipeline/status
```json
{
  "job_id": "demo-1234567890",
  "status": "running|done|failed",
  "current_step": 2,
  "progress": 65,
  "message": "Vectorization in progress..."
}
```

## Notes

- Frontend includes mock fallbacks for all API calls
- Works standalone without backend (shows sample data)
- Ready to connect to Flask backend via `VITE_API_URL` env variable
- All date/time formatting handled client-side
- Category colors defined in `categoryConfig` objects across components
