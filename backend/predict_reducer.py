#!/usr/bin/env python3
# Reducer for prediction pipeline
# Groups and deduplicates cleaned email text
# Input:  subject|||cleaned_text
# Output: subject|||cleaned_text (pass through, deduplication only)

import sys

seen = set()

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    # Simple deduplication — skip exact duplicate cleaned texts
    if '|||' not in line:
        continue
    parts     = line.split('|||', 1)
    cleaned   = parts[1].strip() if len(parts) > 1 else ''
    if not cleaned or cleaned in seen:
        continue
    seen.add(cleaned)
    print(line)