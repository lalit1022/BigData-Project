#!/bin/bash
export HADOOP_HOME=/usr/local/hadoop
export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()     { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $1${NC}"; }

echo ""; echo "═══════════════════════════════════════"
echo "  EMAIL CLASSIFIER — STOPPING SERVICES"
echo "═══════════════════════════════════════"; echo ""

# Stop Flask (if started via npm, not needed if you Ctrl+C manually)
log "Checking Flask..."
if [ -f ~/email_project/flask.pid ]; then
    kill $(cat ~/email_project/flask.pid) 2>/dev/null && success "Flask stopped" || warn "Flask was not running"
    rm -f ~/email_project/flask.pid
else
    warn "Flask pid file not found — assuming already stopped with Ctrl+C"
fi

# Stop Hadoop
log "Stopping YARN..."
stop-yarn.sh 2>&1 | tail -1
log "Stopping HDFS..."
stop-dfs.sh 2>&1 | tail -1
success "Hadoop stopped"

# Stop MongoDB
log "Stopping MongoDB..."
sudo systemctl stop mongod && success "MongoDB stopped" || warn "MongoDB was not running"

echo ""; echo "═══════════════════════════════════════"
echo -e "  ${GREEN}ALL SERVICES STOPPED!${NC}"
echo "═══════════════════════════════════════"; echo ""