# 🚀 Complete Setup Guide - Email Classification System

This guide walks you through setting up the complete email classification system from scratch, including both frontend and backend integration.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** v18 or higher ([Download](https://nodejs.org/))
- [ ] **npm** or **pnpm** package manager
- [ ] **Python** 3.8+ (for Flask backend)
- [ ] **MongoDB** 4.4+ (local or cloud)
- [ ] **Apache Hadoop** 3.x (for production) or mock for development
- [ ] **Git** for version control
- [ ] Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Part 1: Frontend Setup (This Project)

### Step 1: Download/Clone the Project

```bash
# Option A: If you have the zip file
unzip email-classification-frontend.zip
cd email-classification-frontend

# Option B: If cloning from Git
git clone <repository-url>
cd email-classification-frontend
```

### Step 2: Install Dependencies

Choose your preferred package manager:

**Using npm:**
```bash
npm install
```

**Using pnpm (recommended for faster installs):**
```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install
```

### Step 3: Configure API Connection

Open `/src/app/api.js` and update the backend URL:

```javascript
const BASE_URL = 'http://localhost:5000'; // Your Flask backend URL

// For production:
// const BASE_URL = 'https://your-production-api.com';
```

### Step 4: Run Development Server

```bash
npm run dev
# or
pnpm dev
```

✅ **Success!** Open `http://localhost:5173` in your browser.

You should see the email inbox with 22 sample emails.

---

## Part 2: Backend Setup (Flask + MongoDB + Hadoop)

### Overview of Backend Requirements

The frontend expects a Flask REST API with these capabilities:
1. Fetch classified emails from MongoDB
2. Classify single emails
3. Upload CSV and trigger Hadoop MapReduce pipeline
4. Poll pipeline status
5. Provide model statistics

### Step 1: Backend Project Structure

Create a new directory for your Flask backend:

```bash
mkdir email-classifier-backend
cd email-classifier-backend
```

Create this structure:

```
email-classifier-backend/
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
├── config.py              # Configuration
├── models/
│   └── classifier.py      # ML classification logic
├── utils/
│   ├── hadoop_pipeline.py # Hadoop integration
│   └── mongodb.py         # MongoDB connection
└── data/
    └── training_data/     # Training dataset
```

### Step 2: Install Python Dependencies

Create `requirements.txt`:

```txt
Flask==3.0.0
Flask-CORS==4.0.0
pymongo==4.6.1
pandas==2.1.4
numpy==1.26.3
scikit-learn==1.4.0
python-dotenv==1.0.0
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Step 3: Set Up MongoDB

#### Option A: Local MongoDB

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   # MongoDB runs as a service automatically
   ```

3. Verify connection:
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create free account: https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/emaildb
   ```

### Step 4: Create Flask API (`app.py`)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['email_classification']
emails_collection = db['emails']

# Store pipeline jobs in memory (use Redis for production)
pipeline_jobs = {}

# ============================================
# 1. GET /api/emails - Fetch All Emails
# ============================================
@app.route('/api/emails', methods=['GET'])
def get_emails():
    """Fetch all classified emails from MongoDB"""
    try:
        emails = list(emails_collection.find({}, {'_id': 0}))
        return jsonify(emails), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# 2. POST /api/classify - Classify Single Email
# ============================================
@app.route('/api/classify', methods=['POST'])
def classify_email():
    """Classify a single email using ML model"""
    try:
        data = request.json
        from_addr = data.get('from', '')
        subject = data.get('subject', '')
        body = data.get('body', '')

        # TODO: Replace with actual ML classification
        # For now, simple keyword-based classification
        category = classify_simple(from_addr, subject, body)

        # Generate initials
        initials = generate_initials(from_addr)

        # Create email object
        email = {
            'id': int(datetime.now().timestamp() * 1000),
            'from': from_addr,
            'initials': initials,
            'category': category,
            'subject': subject,
            'preview': body[:100] + '...' if len(body) > 100 else body,
            'time': 'Just now',
            'unread': True
        }

        # Save to MongoDB
        emails_collection.insert_one(email)

        return jsonify(email), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# 3. POST /api/pipeline - Start Hadoop Pipeline
# ============================================
@app.route('/api/pipeline', methods=['POST'])
def start_pipeline():
    """Upload CSV and start Hadoop MapReduce pipeline"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Generate job ID
        job_id = str(uuid.uuid4())

        # Save file temporarily
        filename = f'/tmp/{job_id}.csv'
        file.save(filename)

        # Start pipeline (mock for now)
        pipeline_jobs[job_id] = {
            'status': 'processing',
            'progress': 0,
            'total_emails': 0
        }

        # TODO: Start actual Hadoop MapReduce job
        # For development, simulate processing
        import threading
        thread = threading.Thread(target=simulate_pipeline, args=(job_id, filename))
        thread.start()

        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': 'Pipeline started successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# 4. GET /api/pipeline/:job_id - Check Status
# ============================================
@app.route('/api/pipeline/<job_id>', methods=['GET'])
def pipeline_status(job_id):
    """Check Hadoop pipeline status"""
    if job_id not in pipeline_jobs:
        return jsonify({'error': 'Job not found'}), 404

    return jsonify(pipeline_jobs[job_id]), 200

# ============================================
# 5. GET /api/model/stats - Model Statistics
# ============================================
@app.route('/api/model/stats', methods=['GET'])
def model_stats():
    """Get ML model performance statistics"""
    # TODO: Load actual model statistics
    stats = {
        'accuracy': 0.94,
        'precision': 0.92,
        'recall': 0.91,
        'f1_score': 0.915,
        'total_trained': 50000,
        'categories': {
            'Primary': 0.95,
            'Promotions': 0.93,
            'Social': 0.92,
            'Spam': 0.96
        }
    }
    return jsonify(stats), 200

# ============================================
# Helper Functions
# ============================================

def classify_simple(from_addr, subject, body):
    """Simple keyword-based classification (replace with ML model)"""
    text = (from_addr + ' ' + subject + ' ' + body).lower()
    
    # Spam keywords
    if any(word in text for word in ['win', 'prize', 'lottery', 'claim', 'urgent', 'verify', 'suspended']):
        return 'Spam'
    
    # Promotions keywords
    if any(word in text for word in ['sale', 'offer', 'deal', 'discount', '%', 'free', 'buy']):
        return 'Promotions'
    
    # Social keywords
    if any(word in text for word in ['linkedin', 'facebook', 'twitter', 'instagram', 'liked', 'followed', 'friend request']):
        return 'Social'
    
    # Default to Primary
    return 'Primary'

def generate_initials(email):
    """Generate initials from email address"""
    name = email.split('@')[0]
    parts = name.replace('.', ' ').replace('_', ' ').split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    elif len(parts) == 1:
        return parts[0][:2].upper()
    return 'UN'

def simulate_pipeline(job_id, filename):
    """Simulate Hadoop pipeline processing (replace with actual Hadoop job)"""
    import time
    import pandas as pd

    # Read CSV
    df = pd.read_csv(filename)
    total = len(df)

    # Update progress
    for i in range(0, 101, 10):
        time.sleep(0.5)  # Simulate processing time
        pipeline_jobs[job_id]['progress'] = i

    # Process all emails
    for idx, row in df.iterrows():
        category = classify_simple(row['from'], row['subject'], row['body'])
        
        email = {
            'id': idx + 10000,
            'from': row['from'],
            'initials': generate_initials(row['from']),
            'category': category,
            'subject': row['subject'],
            'preview': row['body'][:100] + '...' if len(row['body']) > 100 else row['body'],
            'time': 'Today',
            'unread': False
        }
        
        # Insert into MongoDB
        emails_collection.insert_one(email)

    # Mark as done
    pipeline_jobs[job_id] = {
        'status': 'done',
        'progress': 100,
        'total_emails': total,
        'message': 'Classification complete'
    }

# ============================================
# Run Flask App
# ============================================

if __name__ == '__main__':
    print("🚀 Starting Email Classification API...")
    print("📧 MongoDB:", client.server_info()['version'])
    print("🌐 API running on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
```

### Step 5: Run the Backend

```bash
python app.py
```

✅ **Success!** You should see:
```
🚀 Starting Email Classification API...
📧 MongoDB: 7.0.5
🌐 API running on http://localhost:5000
```

---

## Part 3: Testing the Integration

### Test 1: Fetch Emails

Open browser to `http://localhost:5000/api/emails`

Expected: Empty array `[]` (no emails yet)

### Test 2: Classify Single Email

```bash
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "from": "deals@amazon.com",
    "subject": "50% OFF Sale Today",
    "body": "Limited time offer, shop now!"
  }'
```

Expected: JSON response with classified email

### Test 3: Upload CSV

Create `test_emails.csv`:

```csv
from,subject,body
alice@work.com,Q4 Budget Meeting,Please review the attached agenda...
deals@shop.com,Flash Sale 70% OFF,Don't miss our biggest sale ever!
john@linkedin.com,You have 5 new connections,Connect with professionals in your industry...
spam@unknown.com,You won $1M lottery,Click here to claim your prize immediately!
```

Test upload:

```bash
curl -X POST http://localhost:5000/api/pipeline \
  -F "file=@test_emails.csv"
```

Expected: `{"job_id": "uuid...", "status": "started"}`

### Test 4: Check Pipeline Status

```bash
curl http://localhost:5000/api/pipeline/<job_id>
```

Expected: Progress updates, then `"status": "done"`

### Test 5: Frontend Integration

1. Open frontend at `http://localhost:5173`
2. Click **"Upload dataset"**
3. Select `test_emails.csv`
4. Click **"Start Pipeline"**
5. Watch progress bar
6. Emails should auto-load when complete

✅ **Full integration working!**

---

## Part 4: Production Deployment

### Frontend Deployment

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option B: Netlify

```bash
# Build production
npm run build

# Deploy dist/ folder to Netlify
```

#### Option C: Traditional Server

```bash
# Build
npm run build

# Copy dist/ folder to web server
scp -r dist/* user@server:/var/www/html/
```

### Backend Deployment

#### Option A: Heroku

```bash
# Create Procfile
echo "web: gunicorn app:app" > Procfile

# Add gunicorn to requirements.txt
echo "gunicorn==21.2.0" >> requirements.txt

# Deploy
heroku create email-classifier-api
git push heroku main
```

#### Option B: AWS EC2

```bash
# SSH into EC2
ssh -i key.pem ubuntu@your-ec2-ip

# Install dependencies
sudo apt update
sudo apt install python3-pip mongodb

# Clone and run
git clone <repo>
cd email-classifier-backend
pip3 install -r requirements.txt
python3 app.py
```

#### Option C: Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

```bash
docker build -t email-classifier .
docker run -p 5000:5000 email-classifier
```

---

## Part 5: Hadoop Integration (Production)

### Setting Up Hadoop Cluster

This is optional for development but required for processing large datasets (10k+ emails) in production.

#### Prerequisites
- Apache Hadoop 3.x
- Apache Mahout 0.13+
- HDFS configured
- YARN resource manager

#### Integration Steps

1. **Install Hadoop**: Follow [official guide](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/SingleCluster.html)

2. **Install Mahout**:
   ```bash
   wget https://downloads.apache.org/mahout/0.13.0/apache-mahout-distribution-0.13.0.tar.gz
   tar -xzf apache-mahout-distribution-0.13.0.tar.gz
   ```

3. **Update Flask to trigger Hadoop jobs**:

Replace `simulate_pipeline()` in `app.py`:

```python
def start_hadoop_job(job_id, filename):
    """Start actual Hadoop MapReduce job"""
    import subprocess
    
    # Upload CSV to HDFS
    subprocess.run([
        'hdfs', 'dfs', '-put', 
        filename, 
        f'/input/{job_id}.csv'
    ])
    
    # Run Mahout classification
    result = subprocess.run([
        'mahout', 'trainnb',
        '-i', f'/input/{job_id}.csv',
        '-o', f'/output/{job_id}',
        '-li', '/model/labelindex',
        '-ow'
    ], capture_output=True)
    
    # Process results and save to MongoDB
    # ... implementation details
```

---

## Part 6: Environment Configuration

### Frontend (.env)

Create `/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_ANALYTICS=false
```

### Backend (.env)

Create `/backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/email_classification
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
HADOOP_HOME=/path/to/hadoop
```

Load in `app.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI')
```

---

## 🎯 Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:5000
- [ ] MongoDB connection successful
- [ ] Can classify single email
- [ ] Can upload CSV file
- [ ] Pipeline status updates correctly
- [ ] Emails appear in frontend after pipeline completes
- [ ] Dark mode toggle works
- [ ] Email detail view opens on click
- [ ] Category filtering works
- [ ] Model stats modal displays data

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not running:
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Issue: "CORS Error" in browser console

**Solution:** Ensure Flask has CORS enabled:
```python
from flask_cors import CORS
CORS(app)
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
pip install -r requirements.txt
```

### Issue: CSV upload fails

**Solution:**
- Check file has headers: `from,subject,body`
- Ensure Flask has write permissions to `/tmp/`
- Verify file size < 100MB

---

## 📚 Additional Resources

- **React Docs**: https://react.dev
- **Flask Docs**: https://flask.palletsprojects.com
- **MongoDB Docs**: https://docs.mongodb.com
- **Hadoop Docs**: https://hadoop.apache.org/docs
- **Tailwind CSS**: https://tailwindcss.com

---

## 🎉 Next Steps

1. ✅ Complete setup using this guide
2. 📊 Train your own ML model with real data
3. 🚀 Deploy to production
4. 📈 Monitor performance and accuracy
5. 🔧 Customize UI/UX to your needs

---

**Congratulations! Your email classification system is ready! 🎊**
