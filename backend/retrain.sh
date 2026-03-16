#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AUTOMATED RETRAINING PIPELINE
# Usage: ./retrain.sh /path/to/emailDataset_clean.csv
# ═══════════════════════════════════════════════════════════

set -e  # Stop on any error

CSV_PATH=${1:-"/home/lalit/email_project/emailDataset_clean.csv"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/lalit/email_project/retrain_${TIMESTAMP}.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1" | tee -a $LOG_FILE; }
success() { echo -e "${GREEN}✓ $1${NC}" | tee -a $LOG_FILE; }
error() { echo -e "${RED}✗ $1${NC}" | tee -a $LOG_FILE; exit 1; }

echo "═══════════════════════════════════════════" | tee $LOG_FILE
echo "  MAHOUT EMAIL CLASSIFIER — RETRAINING" | tee -a $LOG_FILE
echo "  Dataset: $CSV_PATH" | tee -a $LOG_FILE
echo "  Started: $(date)" | tee -a $LOG_FILE
echo "═══════════════════════════════════════════" | tee -a $LOG_FILE

# ── Validate input ───────────────────────────────────────────
[ -f "$CSV_PATH" ] || error "CSV file not found: $CSV_PATH"
TOTAL=$(wc -l < "$CSV_PATH")
log "Dataset has $TOTAL lines"

# ── Step 1: Upload CSV to HDFS ───────────────────────────────
log "Step 1/7: Uploading CSV to HDFS..."
hdfs dfs -mkdir -p /email_project/raw_data
hdfs dfs -put -f "$CSV_PATH" /email_project/raw_data/training_data.csv
success "CSV uploaded to HDFS"

# ── Step 2: Clear old training outputs ──────────────────────
log "Step 2/7: Clearing old training data..."
hdfs dfs -rm -r -f \
  /email_project/processed_data_new \
  /email_project/sequencefiles_new \
  /email_project/vectors_new \
  /email_project/train-vectors_new \
  /email_project/test-vectors_new \
  /email_project/model_new \
  /email_project/labelindex_new \
  /email_project/results_new
success "Old data cleared"

# ── Step 3: MapReduce preprocessing ─────────────────────────
log "Step 3/7: Running MapReduce preprocessing..."
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \
  -input /email_project/raw_data/training_data.csv \
  -output /email_project/processed_data_new \
  -mapper /home/lalit/email_project/mapper_reducer/mapper.py \
  -reducer /home/lalit/email_project/mapper_reducer/reducer.py \
  -file /home/lalit/email_project/mapper_reducer/mapper.py \
  -file /home/lalit/email_project/mapper_reducer/reducer.py \
  >> $LOG_FILE 2>&1
success "MapReduce complete"

# Show distribution
log "Category distribution:"
hdfs dfs -cat /email_project/processed_data_new/part-00000 | \
  awk '{print $1}' | sort | uniq -c | tee -a $LOG_FILE

# ── Step 4: Create SequenceFiles ─────────────────────────────
log "Step 4/7: Creating SequenceFiles..."
hdfs dfs -cat /email_project/processed_data_new/part-00000 \
  > /home/lalit/processed_emails_new.txt

java -classpath $(hadoop classpath):/home/lalit/ WriteSeqFile \
  /home/lalit/processed_emails_new.txt \
  /email_project/sequencefiles_new/emails.seq \
  >> $LOG_FILE 2>&1
success "SequenceFiles created"

# ── Step 5: Vectorize with seq2sparse ───────────────────────
log "Step 5/7: Vectorizing with TF-IDF (this takes ~4 mins)..."
mahout seq2sparse \
  -i /email_project/sequencefiles_new/emails.seq \
  -o /email_project/vectors_new \
  -lnorm -nv -wt tfidf -ng 2 -ml 5 -ow \
  >> $LOG_FILE 2>&1

VECTOR_SIZE=$(hdfs dfs -du -s /email_project/vectors_new/tfidf-vectors | awk '{print $1}')
success "Vectorization complete — $(($VECTOR_SIZE/1024/1024))MB vectors"

# ── Step 6: Train + Test Naive Bayes ────────────────────────
log "Step 6/7: Training Mahout Naive Bayes..."
mahout split \
  -i /email_project/vectors_new/tfidf-vectors \
  --trainingOutput /email_project/train-vectors_new \
  --testOutput /email_project/test-vectors_new \
  --randomSelectionPct 20 --overwrite --sequenceFiles -xm sequential \
  >> $LOG_FILE 2>&1

mahout trainnb \
  -i /email_project/train-vectors_new \
  -o /email_project/model_new \
  -li /email_project/labelindex_new -ow \
  >> $LOG_FILE 2>&1

log "Testing model accuracy..."
mahout testnb \
  -i /email_project/test-vectors_new \
  -m /email_project/model_new \
  -l /email_project/labelindex_new \
  -ow -o /email_project/results_new \
  2>&1 | tee -a $LOG_FILE | grep -A 20 "Summary"

success "Training complete"

# ── Step 7: Export model weights ────────────────────────────
log "Step 7/7: Exporting model weights to Python..."
java -classpath \
  $(hadoop classpath):/usr/local/mahout/mahout-mr-0.13.0.jar:/usr/local/mahout/mahout-math-0.13.0.jar:/usr/local/mahout/mahout-mr-0.13.0-job.jar:/home/lalit/ \
  extract_model \
  /email_project/model_new \
  /home/lalit/model_weights_new.txt \
  >> $LOG_FILE 2>&1

# ── Promote new model to production ─────────────────────────
log "Promoting new model to production..."

# Backup old model
cp ~/model_weights.txt ~/model_weights_backup.txt 2>/dev/null || true

# Replace with new
cp ~/model_weights_new.txt ~/model_weights.txt

# Update dictionary path in mahout_classifier.py
sed -i "s|/email_project/vectors.*/dictionary|/email_project/vectors_new/dictionary|g" \
  /home/lalit/email_project/backend/mahout_classifier.py

success "New model promoted to production"

# ── Summary ──────────────────────────────────────────────────
echo "" | tee -a $LOG_FILE
echo "═══════════════════════════════════════════" | tee -a $LOG_FILE
echo "  RETRAINING COMPLETE!" | tee -a $LOG_FILE
echo "  Log saved to: $LOG_FILE" | tee -a $LOG_FILE
echo "  Finished: $(date)" | tee -a $LOG_FILE
echo "═══════════════════════════════════════════" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo -e "${GREEN}NEXT STEP: Restart Flask to load new model${NC}" | tee -a $LOG_FILE
echo "  cd ~/email_project/backend && python3 app.py" | tee -a $LOG_FILE
