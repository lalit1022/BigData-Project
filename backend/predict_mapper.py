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

# Read header to find column positions
header = next(reader, None)
if header is None:
    sys.exit(0)

cols = [c.strip().lower() for c in header]

# Find subject and body indices flexibly
subject_idx = cols.index('subject') if 'subject' in cols else 0
body_idx    = cols.index('body')    if 'body'    in cols else 1

for row in reader:
    try:
        if len(row) <= max(subject_idx, body_idx):
            continue

        subject = str(row[subject_idx]).strip()
        body    = str(row[body_idx]).strip()

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

        safe_subject = subject.replace('|||',' ').replace('\n',' ').replace('\r',' ')
        print(f"{safe_subject}|||{cleaned}")

    except Exception:
        continue