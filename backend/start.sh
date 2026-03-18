#!/bin/bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export HADOOP_HOME=/usr/local/hadoop
export MAHOUT_HOME=/usr/local/mahout
export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$MAHOUT_HOME/bin:$PATH

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()     { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $1${NC}"; }
error()   { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""; echo "═══════════════════════════════════════"
echo "  EMAIL CLASSIFIER — STARTING SERVICES"
echo "═══════════════════════════════════════"; echo ""

# 1. Hadoop
log "Starting Hadoop..."
if jps 2>/dev/null | grep -q "NameNode"; then
    warn "Hadoop already running"
else
    start-dfs.sh 2>&1 | tail -2
    start-yarn.sh 2>&1 | tail -2
    sleep 3
fi
jps | grep -q "NameNode" && success "Hadoop running" || error "Hadoop failed — run: start-dfs.sh && start-yarn.sh"

# 2. MongoDB
log "Starting MongoDB..."
sudo systemctl is-active --quiet mongod || sudo systemctl start mongod
sleep 1
sudo systemctl is-active --quiet mongod && success "MongoDB running" || error "MongoDB failed"

# 3. Check model weights
[ -f ~/model_weights.txt ] && success "model_weights.txt found" || error "model_weights.txt missing — run retrain.sh first"

echo ""
echo "═══════════════════════════════════════"
echo -e "  ${GREEN}HADOOP + MONGODB READY!${NC}"
echo ""
echo "  Now start Flask in a new terminal:"
echo -e "  ${YELLOW}cd ~/email_project/backend && python3 app.py${NC}"
echo ""
echo "  Then start React (Windows terminal):"
echo -e "  ${YELLOW}cd emailApp && npm run dev${NC}"
echo "═══════════════════════════════════════"; echo ""