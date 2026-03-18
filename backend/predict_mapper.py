#!/usr/bin/env python3
import sys
import csv
import re
import io

STOPWORDS = {
    "a","an","the","and","or","but","if","while","with","this","that","to","from",
    "in","on","at","for","of","by","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","should","could","can",
    "may","might","must","shall","i","you","he","she","it","we","they","them",
    "my","your","his","her","its","our","their"
}

content = sys.stdin.read()
reader  = csv.reader(io.StringIO(content))

header = next(reader, None)
if header is None:
    sys.exit(0)

cols = [c.strip().lower() for c in header]

subject_idx = cols.index('subject') if 'subject' in cols else 0
body_idx    = cols.index('body')    if 'body'    in cols else 1

# Optional metadata columns
from_idx = cols.index('from')   if 'from'   in cols else -1
sender_idx = cols.index('sender') if 'sender' in cols else -1
time_idx = cols.index('time')   if 'time'   in cols else -1
date_idx = cols.index('date')   if 'date'   in cols else -1

for row in reader:
    try:
        if len(row) <= max(subject_idx, body_idx):
            continue

        subject = str(row[subject_idx]).strip()
        body    = str(row[body_idx]).strip()

        # Extract optional metadata — use first available
        sender = ''
        if from_idx >= 0 and from_idx < len(row):
            sender = str(row[from_idx]).strip()
        elif sender_idx >= 0 and sender_idx < len(row):
            sender = str(row[sender_idx]).strip()

        time_val = ''
        if time_idx >= 0 and time_idx < len(row):
            time_val = str(row[time_idx]).strip()
        elif date_idx >= 0 and date_idx < len(row):
            time_val = str(row[date_idx]).strip()

        text = (subject + " " + body).lower()
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'http\S+|www\S+', ' ', text)
        text = re.sub(r'\S+@\S+', ' ', text)
        text = re.sub(r'[^a-z\s]', ' ', text)

        words    = text.split()
        filtered = [w for w in words if w not in STOPWORDS and len(w) > 2]
        cleaned  = ' '.join(filtered)

        if len(filtered) < 2:
            continue

        # Sanitize all fields — strip ||| and newlines
        safe_subject = subject.replace('|||', ' ').replace('\n', ' ').replace('\r', ' ')
        safe_sender  = sender.replace('|||', ' ').replace('\n', ' ').replace('\r', ' ')
        safe_time    = time_val.replace('|||', ' ').replace('\n', ' ').replace('\r', ' ')

        # Output format: subject|||cleaned|||sender|||time
        print(f"{safe_subject}|||{cleaned}|||{safe_sender}|||{safe_time}")

    except Exception:
        continue