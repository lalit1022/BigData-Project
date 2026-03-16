import os
import re
import math
import subprocess
from collections import defaultdict

LABEL_MAP = {0: 'Primary', 1: 'Promotions', 2: 'Social', 3: 'Spam'}

STOPWORDS = {
    "a","an","the","and","or","but","if","while","with","this","that","to","from",
    "in","on","at","for","of","by","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","should","could","can",
    "may","might","must","shall","i","you","he","she","it","we","they","them",
    "my","your","his","her","its","our","their"
}

class MahoutNaiveBayesClassifier:

    def __init__(self, weights_path, hdfs_dict_path):
        self.label_weights   = {}
        self.feature_weights = {}
        self.metadata        = {}
        self.dictionary      = {}
        self.loaded          = False
        self._load_weights(weights_path)
        self._load_dictionary(hdfs_dict_path)

    def _load_weights(self, path):
        print(f"Loading Mahout model weights...")
        section = None
        try:
            with open(path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    if   line.startswith('NUM_LABELS='):   self.metadata['num_labels']   = int(line.split('=')[1])
                    elif line.startswith('NUM_FEATURES='): self.metadata['num_features'] = int(line.split('=')[1])
                    elif line.startswith('ALPHA_I='):      self.metadata['alpha']        = float(line.split('=')[1])
                    elif line.startswith('TOTAL_WEIGHT='): self.metadata['total_weight'] = float(line.split('=')[1])
                    elif line == '=== LABEL_WEIGHTS ===':  section = 'label'
                    elif line == '=== FEATURE_WEIGHTS ===':section = 'feature'
                    elif section == 'label':
                        idx, val = line.split('=')
                        self.label_weights[int(idx)] = float(val)
                    elif section == 'feature':
                        parts = line.split('=')
                        val   = float(parts[1])
                        lbl, feat = parts[0].split(',')
                        lbl  = int(lbl)
                        feat = int(feat)
                        if lbl not in self.feature_weights:
                            self.feature_weights[lbl] = {}
                        self.feature_weights[lbl][feat] = val
            self.loaded = True
            print(f"Weights loaded: {self.metadata['num_labels']} labels, "
                  f"{self.metadata['num_features']} features")
        except Exception as e:
            print(f"Error loading weights: {e}")
            self.loaded = False

    def _load_dictionary(self, hdfs_path):
        print("Loading dictionary from HDFS...")
        try:
            result = subprocess.run(
                ['mahout', 'seqdumper', '-i', hdfs_path],
                capture_output=True, text=True, timeout=120
            )
            for line in result.stdout.split('\n'):
                if line.startswith('Key:') and 'Value:' in line:
                    parts = line.split('Value:')
                    word  = parts[0].replace('Key:', '').strip()
                    idx   = int(parts[1].strip())
                    self.dictionary[word] = idx
            print(f"Dictionary loaded: {len(self.dictionary)} words")
        except Exception as e:
            print(f"Error loading dictionary: {e}")

    def _get_vector(self, subject, body):
        text  = (subject + ' ' + body).lower()
        text  = re.sub(r'[^a-z\s]', ' ', text)
        words = [w for w in text.split()
                 if w not in STOPWORDS and len(w) > 2]
        tf = defaultdict(int)
        for w in words:
            tf[w] += 1
        vector = {}
        for word, count in tf.items():
            key = word + ':'
            if key in self.dictionary:
                vector[self.dictionary[key]] = count
            elif word in self.dictionary:
                vector[self.dictionary[word]] = count
        return vector

    def classify(self, subject, body):
        if not self.loaded or not self.dictionary:
            return self._keyword_fallback(subject + ' ' + body)

        vector       = self._get_vector(subject, body)
        total_weight = self.metadata['total_weight']
        num_features = self.metadata['num_features']
        alpha        = self.metadata['alpha']
        scores       = {}

        for label_idx in range(self.metadata['num_labels']):
            label_w      = self.label_weights[label_idx]
            feat_weights = self.feature_weights.get(label_idx, {})
            score        = math.log(label_w / total_weight + 1e-10)

            for feat_idx, count in vector.items():
                feat_w = feat_weights.get(feat_idx, 0.0)
                prob   = (feat_w + alpha) / (label_w + alpha * num_features)
                score += count * math.log(prob + 1e-10)

            scores[label_idx] = score

        best_label = max(scores, key=scores.get)
        category   = LABEL_MAP[best_label]

        max_s  = max(scores.values())
        exps   = {k: math.exp(min(v - max_s, 500)) for k,v in scores.items()}
        total  = sum(exps.values())
        conf   = exps[best_label] / total if total > 0 else 0.75

        return category, round(min(conf, 0.99), 3)

    def _keyword_fallback(self, text):
        text = text.lower()
        spam_kw  = ['lottery','winner','prize','urgent','verify','suspended',
                    'million','bank account','click now','claim','congratulations',
                    'act now','free iphone','make money']
        promo_kw = ['discount','sale','offer','deal','shop','coupon',
                    'free shipping','unsubscribe','limited time','exclusive',
                    'promo','save','clearance','flash sale','newsletter']
        social_kw= ['liked','friend request','follower','party','event',
                    'invite','birthday','concert','movie','festival',
                    'rsvp','join us','meetup','notification']
        if any(k in text for k in spam_kw):   return 'Spam', 0.88
        if any(k in text for k in promo_kw):  return 'Promotions', 0.82
        if any(k in text for k in social_kw): return 'Social', 0.80
        return 'Primary', 0.75


# ── Singleton — loaded once at Flask startup ─────────────────
_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        weights_path  = os.path.expanduser('~/model_weights.txt')
        hdfs_dict     = '/email_project/vectors_new/dictionary.file-0'
        _classifier   = MahoutNaiveBayesClassifier(weights_path, hdfs_dict)
    return _classifier


if __name__ == '__main__':
    clf = get_classifier()
    tests = [
        ("Meeting tomorrow office",    "Please confirm attendance quarterly review budget"),
        ("Flash sale 50 off today",    "Limited time discount shop now free shipping deal"),
        ("You won lottery prize",      "Click here claim your million dollar prize winner"),
        ("John liked your post",       "Your article got reactions join the social event"),
        ("Invoice February services",  "Please find attached invoice payment due thirty days"),
        ("New movie released friday",  "Join us screening premiere tickets available rsvp"),
    ]
    print("\n=== MAHOUT NAIVE BAYES CLASSIFIER ===")
    for subject, body in tests:
        cat, conf = clf.classify(subject, body)
        print(f"[{cat}] ({conf:.0%}) — {subject}")