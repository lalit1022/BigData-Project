#!/usr/bin/env python3
import sys
import csv
import re

stop_words = {
    "a","an","the","and","or","but","if","while","with","this","that","to","from",
    "in","on","at","for","of","by","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","should","could","can",
    "may","might","must","shall","i","you","he","she","it","we","they","them",
    "my","your","his","her","its","our","their"
}

categories = {'Primary', 'Spam', 'Promotions', 'Social'}

for line in sys.stdin:
    line = line.strip()
    try:
        row = next(csv.reader([line]))
        if len(row) < 3:
            continue
        subject  = row[0]
        body     = row[1]
        category = row[2].strip()

        # Skip header row
        if category == 'category' or category not in categories:
            continue

        text     = (subject + " " + body).lower()
        text     = re.sub(r'[^a-z\s]', ' ', text)
        words    = text.split()
        filtered = [w for w in words if w not in stop_words and len(w) > 2]
        cleaned  = " ".join(filtered)

        if len(filtered) < 3:
            continue

        print(f"{category}\t{cleaned}")
    except:
        continue