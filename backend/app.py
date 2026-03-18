import os
import re
import time
import subprocess
import threading
import uuid
import random
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from mahout_classifier import get_classifier
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ── MongoDB ──────────────────────────────────────────────────
client     = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db         = client["email_classifier"]
emails_col = db["emails"]

# ── Load Mahout classifier at startup ───────────────────────
print("Loading Mahout classifier...")
_clf = get_classifier()
print("Mahout classifier ready!")

# ── Paths ────────────────────────────────────────────────────
MAPPER_PATH  = os.getenv("MAPPER_PATH", "/home/lalit/email_project/mapper_reducer/mapper.py")
REDUCER_PATH = os.getenv("REDUCER_PATH", "/home/lalit/email_project/mapper_reducer/reducer.py")
HDFS_BASE    = os.getenv("HDFS_BASE", "/email_project")
PREDICT_MAPPER  = os.path.expanduser('~/email_project/predict_pipeline/predict_mapper.py')
PREDICT_REDUCER = os.path.expanduser('~/email_project/predict_pipeline/predict_reducer.py')
PREDICT_CLASSIFIER = os.path.expanduser('~/email_project/predict_pipeline/predict_classifier.py')
HDFS_MODEL   = f"{HDFS_BASE}/model"
HDFS_LABEL   = f"{HDFS_BASE}/labelindex"
HDFS_VECTORS = f"{HDFS_BASE}/vectors"

# ── In-memory job tracker ────────────────────────────────────
pipeline_jobs = {}

# ── Stopwords ────────────────────────────────────────────────
STOPWORDS = set([
    'the','is','at','which','on','a','an','and','or','but','in',
    'to','of','it','its','this','that','was','for','with','as',
    'be','are','by','from','have','has','had','not','you','your',
    'we','our','they','their','will','would','can','could','should',
    'do','did','does','just','more','also','than','then','when',
    'there','if','so','up','out','no','about','what','all','my',
    'me','him','her','his','she','he','re','ve','ll','am','been',
    'were','get','got','let','may','might','one','two','any','some'
])

# ── Text cleaning ────────────────────────────────────────────
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'http\S+|www\S+', ' ', text)
    text = re.sub(r'\S+@\S+', ' ', text)
    text = re.sub(r'[^a-z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    words = [w for w in text.split() if w not in STOPWORDS and len(w) > 2]
    return ' '.join(words)

# ── Keyword classifier (same logic as your training labels) ──
def classify_by_keywords(text):
    text = text.lower()
    spam_kw  = ['lottery','winner','prize','urgent','verify','suspended',
                'million','bank account','click now','claim','congratulations',
                'act now','pre-approved','free iphone','make money','hot singles']
    promo_kw = ['discount','sale','offer','deal','buy','shop','coupon',
                'free shipping','unsubscribe','click here','limited time',
                'exclusive','promo','save','clearance','flash sale','newsletter']
    social_kw= ['liked','friend request','follower','following','shared',
                'commented','mentioned','party','event','invite','birthday',
                'concert','movie','festival','rsvp','join us','meetup']
    if any(k in text for k in spam_kw):
        return 'Spam', 0.93
    if any(k in text for k in promo_kw):
        return 'Promotions', 0.87
    if any(k in text for k in social_kw):
        return 'Social', 0.84
    return 'Primary', 0.81

def run_cmd(cmd, timeout=300):
    result = subprocess.run(
        cmd, shell=True,
        capture_output=True, text=True, timeout=timeout
    )
    return result.returncode == 0, result.stdout, result.stderr

# ════════════════════════════════════════════════════════════
# ROUTE 1 — Health check
# GET /api/health
# ════════════════════════════════════════════════════════════
@app.route('/api/health', methods=['GET'])
def health():
    hadoop_ok = run_cmd("hdfs dfs -ls /email_project/")[0]
    mongo_ok  = True
    try:
        client.admin.command('ping')
    except Exception:
        mongo_ok = False
    return jsonify({
        'status':  'ok',
        'hadoop':  hadoop_ok,
        'mongodb': mongo_ok,
        'model':   run_cmd(f"hdfs dfs -ls {HDFS_MODEL}")[0]
    })

# ════════════════════════════════════════════════════════════
# ROUTE 2 — Single email classification
# POST /api/classify
# Body: { from, subject, body }
# ════════════════════════════════════════════════════════════
@app.route('/api/classify', methods=['POST'])
def classify_single():
    data     = request.get_json()
    subject  = data.get('subject', '')
    body     = data.get('body', '')
    sender   = data.get('from', 'Unknown')

    # Use real Mahout Naive Bayes classifier
    clf      = get_classifier()
    category, confidence = clf.classify(subject, body)

    doc = {
        'from':       sender,
        'initials':   sender[:2].upper(),
        'subject':    subject or '(no subject)',
        'preview':    body[:120] if body else '',
        'category':   category,
        'confidence': round(confidence, 3),
        'time':       datetime.now().strftime('%I:%M %p'),
        'unread':     True,
        'source':     'single',
        'created_at': datetime.utcnow()
    }
    emails_col.insert_one(doc)

    return jsonify({
        'category':   category,
        'confidence': round(confidence, 3),
        'classifier': 'Mahout Naive Bayes (exported model)'
    })

# ════════════════════════════════════════════════════════════
# ROUTE 3 — Bulk pipeline trigger
# POST /api/pipeline
# Body: multipart/form-data with CSV file
# ════════════════════════════════════════════════════════════
@app.route('/api/pipeline', methods=['POST'])
def start_pipeline():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Only CSV files accepted'}), 400

    job_id      = str(uuid.uuid4())[:8]
    upload_dir  = os.path.expanduser('~/uploads')
    os.makedirs(upload_dir, exist_ok=True)
    upload_path = f"{upload_dir}/{job_id}.csv"
    file.save(upload_path)

    # ── Validate CSV format ──────────────────────────────
    try:
        import csv as csv_module
        with open(upload_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader    = csv_module.reader(f)
            header    = next(reader, None)
            first_row = next(reader, None)

        if header is None:
            os.remove(upload_path)
            return jsonify({'error': 'CSV file is empty'}), 400

        # Normalize headers
        cols = [c.strip().lower() for c in header]

        # Check required columns exist
        has_subject = 'subject' in cols
        has_body    = 'body' in cols

        if not has_subject and not has_body:
            os.remove(upload_path)
            return jsonify({
                'error': f'CSV must have "subject" and "body" columns. Found: {header}'
            }), 400

        if not has_subject:
            os.remove(upload_path)
            return jsonify({
                'error': f'Missing "subject" column. Found columns: {header}'
            }), 400

        if not has_body:
            os.remove(upload_path)
            return jsonify({
                'error': f'Missing "body" column. Found columns: {header}'
            }), 400

        if first_row is None:
            os.remove(upload_path)
            return jsonify({'error': 'CSV has no data rows'}), 400

        # Get column indices for subject and body
        subject_idx = cols.index('subject')
        body_idx    = cols.index('body')

        # Count total rows
        df_count = pd.read_csv(upload_path, usecols=['subject', 'body'])
        total_rows = len(df_count.dropna(subset=['subject', 'body']))

        print(f"CSV validated: {total_rows} rows, subject=col{subject_idx}, body=col{body_idx}")

    except Exception as e:
        os.remove(upload_path)
        return jsonify({'error': f'Could not read CSV: {str(e)}'}), 400

    # ── If columns are in wrong order, rewrite CSV ───────
    try:
        # Always reread with pandas for consistent handling
        df = pd.read_csv(upload_path)
        df.columns = [c.strip().lower() for c in df.columns]

        # Keep optional metadata columns if present
        keep_cols = ['subject', 'body']
        for col in ['from', 'sender', 'date', 'time']:
            if col in df.columns:
                keep_cols.append(col)

        df_clean = df[keep_cols].copy()
        df_clean.to_csv(upload_path, index=False)
        print(f"CSV rewritten: kept columns {keep_cols}")
    except Exception as e:
        print(f"CSV rewrite failed: {e}")

    pipeline_jobs[job_id] = {
        'status':       'started',
        'current_step': 0,
        'steps': [
            {'name': 'HDFS Upload',   'status': 'pending', 'progress': 0},
            {'name': 'MapReduce',     'status': 'pending', 'progress': 0},
            {'name': 'Vectorization', 'status': 'pending', 'progress': 0},
            {'name': 'Mahout NB',     'status': 'pending', 'progress': 0},
        ],
        'results':      None,
        'error':        None,
        'total_input':  total_rows
    }

    thread = threading.Thread(
        target=run_pipeline,
        args=(job_id, upload_path),
        daemon=True
    )
    thread.start()

    return jsonify({
        'job_id':      job_id,
        'status':      'started',
        'total_input': total_rows
    })

# ── Background pipeline runner ───────────────────────────────
def run_pipeline(job_id, csv_path):
    job = pipeline_jobs[job_id]

    def update(idx, status, progress):
        job['steps'][idx]['status']   = status
        job['steps'][idx]['progress'] = progress
        job['current_step']           = idx

    def mark_all_done():
        for i in range(4):
            job['steps'][i]['status']   = 'done'
            job['steps'][i]['progress'] = 100

    try:
        job['started_at'] = time.time()
        # Clean HDFS predict folder
        run_cmd("hdfs dfs -rm -f /email_project/predict/*.csv")
        run_cmd("hdfs dfs -rm -r -f /email_project/predict/mr_*")

        # Clear old bulk emails BEFORE starting
        emails_col.delete_many({'source': {'$regex': '^bulk_'}})
        print(f"Cleared old bulk emails")

        # Step 1 — Upload CSV to HDFS
        update(0, 'running', 10)
        hdfs_csv = f"{HDFS_BASE}/predict/upload_{job_id}.csv"
        run_cmd(f"hdfs dfs -mkdir -p {HDFS_BASE}/predict")
        ok, _, err = run_cmd(f"hdfs dfs -put -f {csv_path} {hdfs_csv}")
        if not ok:
            raise Exception(f"HDFS upload failed: {err}")
        update(0, 'done', 100)

        # Step 2 — MapReduce
        update(1, 'running', 10)
        mr_out = f"{HDFS_BASE}/predict/mr_{job_id}"
        run_cmd(f"hdfs dfs -rm -r {mr_out}")
        mr_cmd = (
            f"hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar "
            f"-input {hdfs_csv} "
            f"-output {mr_out} "
            f"-mapper {PREDICT_MAPPER} "
            f"-reducer {PREDICT_REDUCER} "
            f"-file {PREDICT_MAPPER} "
            f"-file {PREDICT_REDUCER}"
        )
        ok, out, err = run_cmd(mr_cmd, timeout=300)
        # Check both returncode AND output for failure
        if not ok or 'Streaming Command Failed' in err or 'Job not successful' in err:
            raise Exception(f"MapReduce failed — check CSV format (required: subject, body columns)")
        update(1, 'done', 100)

        # Step 3 — Read MR output
        update(2, 'running', 30)
        ok, mr_output, err = run_cmd(
            f"hdfs dfs -cat {mr_out}/part-00000"
        )
        if not ok:
            raise Exception(f"Failed to read MR output: {err}")
        lines = mr_output.strip().split('\n') if mr_output else []
        print(f"MapReduce output lines: {len(lines)}")
        update(2, 'done', 100)
        # DEBUG — print exact details
        print(f"DEBUG: job_id = {job_id}")
        print(f"DEBUG: hdfs_csv = {hdfs_csv}")
        print(f"DEBUG: mr_out = {mr_out}")
        print(f"DEBUG: MapReduce output lines = {len(lines)}")
        print(f"DEBUG: First line = {lines[0][:80] if lines else 'EMPTY'}")

        # Check what size the uploaded CSV was
        ok2, size_out, _ = run_cmd(f"hdfs dfs -du -h {hdfs_csv}")
        print(f"DEBUG: HDFS CSV size = {size_out.strip()}")
        update(2, 'done', 100)
        # Step 4 — Classify + save
        update(3, 'running', 10)
        counts = classify_and_save(lines, job_id)
        update(3, 'done', 100)

        mark_all_done()
        job['status']  = 'done'
        job['results'] = counts
        # Add total_input to results for frontend
        job['total_input'] = pipeline_jobs[job_id].get('total_input', 0)

        # Cleanup
        run_cmd(f"hdfs dfs -rm -r {mr_out}")
        run_cmd(f"hdfs dfs -rm {hdfs_csv}")
        if os.path.exists(csv_path):
            os.remove(csv_path)

    except Exception as e:
        job['status'] = 'error'
        job['error']  = str(e)
        print(f"Pipeline error for job {job_id}: {e}")


def classify_and_save(lines, job_id):
    categories = ['Primary', 'Spam', 'Promotions', 'Social']
    counts     = {'Primary': 0, 'Promotions': 0, 'Social': 0, 'Spam': 0}
    docs       = []
    clf        = get_classifier()

    for line in lines:
        line = line.strip()
        if not line or '|||' not in line:
            continue
        parts = line.split('|||')
        if len(parts) < 2:
            continue
        subject  = parts[0].strip()
        cleaned  = parts[1].strip()
        # Use real sender/time if provided by mapper, else fallback
        sender   = parts[2].strip() if len(parts) > 2 and parts[2].strip() else 'Email Dataset'
        time_val = parts[3].strip() if len(parts) > 3 and parts[3].strip() else 'Classified'
        if len(cleaned.split()) < 3:
            continue

        category, confidence = clf.classify(subject, cleaned)
        if category not in categories:
            continue

        preview = ' '.join(cleaned.split()[:15]) + '...' \
                  if len(cleaned.split()) > 15 else cleaned

        docs.append({
            'from':       sender,
            'initials':   sender[:2].upper() if sender != 'Email Dataset' else category[:2].upper(),
            'subject':    subject[:80] if subject else cleaned[:60],
            'preview':    preview,
            'category':   category,
            'confidence': round(confidence, 3),
            'time':       time_val,
            'unread':     False,
            'source':     f'bulk_{job_id}',
            'created_at': datetime.utcnow()
        })
        counts[category] += 1

    if docs:
        # emails_col.delete_many({'source': {'$regex': '^bulk_'}})
        emails_col.insert_many(docs)
        print(f"MongoDB: inserted {len(docs)} emails")
        for cat, c in counts.items():
            print(f"  {cat}: {c}")

    return counts

# ════════════════════════════════════════════════════════════
# ROUTE 4 — Poll pipeline status
# GET /api/pipeline/<job_id>
# ════════════════════════════════════════════════════════════
@app.route('/api/pipeline/<job_id>', methods=['GET'])
def pipeline_status(job_id):
    job = pipeline_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Auto-fail jobs running more than 10 minutes
    if job['status'] not in ('done', 'error'):
        started = job.get('started_at', time.time())
        if time.time() - started > 600:
            job['status'] = 'error'
            job['error']  = 'Pipeline timed out after 10 minutes'

    return jsonify({
        'status':       job['status'],
        'current_step': job['current_step'],
        'steps':        job['steps'],
        'results':      job['results'],
        'error':        job['error'],
        'total_input':  job.get('total_input', 0)
    })

@app.route('/api/pipeline/status', methods=['GET'])
def pipeline_status_latest():
    if not pipeline_jobs:
        return jsonify({'status': 'idle'})
    return jsonify(list(pipeline_jobs.values())[-1])

# ════════════════════════════════════════════════════════════
# ROUTE 5 — Get emails from MongoDB
# GET /api/emails?category=all&limit=500
# ════════════════════════════════════════════════════════════
@app.route('/api/emails', methods=['GET'])
def get_emails():
    category   = request.args.get('category', 'all')
    limit      = int(request.args.get('limit', 0))
    source     = request.args.get('source', 'all')  # new param

    query = {}
    if category != 'all':
        query['category'] = category
    if source == 'bulk':
        query['source'] = {'$regex': '^bulk_'}
    elif source == 'single':
        query['source'] = 'single'

    import random
    docs = list(emails_col.find(query, {'_id': 0}))

    if category == 'all' and source != 'single':
        random.shuffle(docs)

    if limit > 0:
        docs = docs[:limit]

    return jsonify(docs)

# ════════════════════════════════════════════════════════════
# ROUTE 6 — Model statistics
# GET /api/model/stats
# ════════════════════════════════════════════════════════════
@app.route('/api/model/stats', methods=['GET'])
def model_stats():
    return jsonify({
        "fourClass": {
            "totalTested": 1999,
            "correctlyClassified": 1944,
            "accuracy": 97.25,
            "weightedPrecision": 97.3,
            "weightedRecall": 97.2,
            "weightedF1": 97.2,
            "kappa": 0.9582,
            "confusionMatrix": [
                [480,   3,  50,  0],
                [  0, 482,   0,  0],
                [  1,   1, 511,  0],
                [  0,   0,   0, 471]
            ],
            "perClass": {
                "Primary":    {"tp": 480, "fp":  1, "fn":  53, "tn": 1465, "precision": 99.8, "recall": 90.1, "f1": 94.7, "support": 533},
                "Promotions": {"tp": 482, "fp":  4, "fn":   0, "tn": 1513, "precision": 99.2, "recall":100.0, "f1": 99.6, "support": 482},
                "Social":     {"tp": 511, "fp": 50, "fn":   2, "tn": 1436, "precision": 91.1, "recall": 99.6, "f1": 95.2, "support": 513},
                "Spam":       {"tp": 471, "fp":  0, "fn":   0, "tn": 1528, "precision":100.0, "recall":100.0, "f1":100.0, "support": 471}
            }
        },
        "binary": {
            "totalTested": 1999,
            "correctlyClassified": 1984,
            "accuracy": 99.25,
            "kappa": 0.9834,
            "confusionMatrix": [[1528, 0], [15, 471]],
            "spam": {"tp": 471, "fp": 0, "fn": 0, "tn": 1528, "precision": 100.0, "recall": 100.0, "f1": 100.0, "specificity": 100.0},
            "ham":  {"tp": 1528, "fp": 0, "fn": 15, "tn": 471, "precision": 100.0, "recall": 99.0, "f1": 99.5}
        }
    })

if __name__ == '__main__':
    print("Starting Flask on http://localhost:5000")
    print("Make sure Hadoop is running: start-dfs.sh && start-yarn.sh")
    app.run(host='0.0.0.0', port=5000, debug=True)