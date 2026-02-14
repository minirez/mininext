#!/bin/bash
# =============================================================================
# MongoDB Automated Backup Script
# =============================================================================
# Usage:
#   ./scripts/backup.sh                    # Full backup (local + S3)
#   ./scripts/backup.sh --local-only       # Only local backup (no S3)
#   ./scripts/backup.sh --restore <path>   # Restore from backup
#
# Crontab (daily at 3 AM):
#   0 3 * * * /var/www/booking-engine/scripts/backup.sh >> /var/log/mongodb-backup.log 2>&1
#
# Dependencies:
#   - mongodump / mongorestore (mongodb-database-tools)
#   - aws cli (for S3 upload)
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/mongodb"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="booking-engine_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# MongoDB connection (Docker container or local)
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/booking-engine}"
MONGO_CONTAINER="${MONGO_CONTAINER:-minirez-mongodb}"

# AWS S3 (optional)
S3_BUCKET="${S3_BUCKET:-maxirez-backups}"
S3_PREFIX="${S3_PREFIX:-mongodb}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }

# ============================================================================
# RESTORE MODE
# ============================================================================
if [[ "${1:-}" == "--restore" ]]; then
  RESTORE_PATH="${2:-}"
  if [[ -z "$RESTORE_PATH" ]]; then
    error "Usage: $0 --restore <backup-path>"
    echo "  Example: $0 --restore /var/backups/mongodb/booking-engine_2026-02-15_03-00-00"
    echo ""
    echo "Available backups:"
    ls -1d "${BACKUP_DIR}"/booking-engine_* 2>/dev/null || echo "  No backups found in ${BACKUP_DIR}"
    exit 1
  fi

  if [[ ! -d "$RESTORE_PATH" ]]; then
    error "Backup directory not found: $RESTORE_PATH"
    exit 1
  fi

  echo ""
  warn "This will OVERWRITE the current database!"
  read -p "Are you sure you want to restore from ${RESTORE_PATH}? (yes/no): " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Restore cancelled."
    exit 0
  fi

  log "Restoring from ${RESTORE_PATH}..."

  # Check if running in Docker
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$MONGO_CONTAINER"; then
    log "Restoring via Docker container (${MONGO_CONTAINER})..."
    docker cp "${RESTORE_PATH}" "${MONGO_CONTAINER}:/tmp/restore"
    docker exec "$MONGO_CONTAINER" mongorestore \
      --uri="mongodb://localhost:27017" \
      --drop \
      "/tmp/restore"
    docker exec "$MONGO_CONTAINER" rm -rf /tmp/restore
  else
    mongorestore --uri="$MONGODB_URI" --drop "$RESTORE_PATH"
  fi

  log "Restore completed successfully!"
  warn "You may need to restart the API: docker compose restart booking-api"
  exit 0
fi

# ============================================================================
# BACKUP MODE
# ============================================================================
LOCAL_ONLY="${1:-}"

log "Starting MongoDB backup..."
log "Backup path: ${BACKUP_PATH}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if MongoDB is running in Docker
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$MONGO_CONTAINER"; then
  log "Using Docker container (${MONGO_CONTAINER})..."

  # Run mongodump inside container
  docker exec "$MONGO_CONTAINER" mongodump \
    --uri="mongodb://localhost:27017" \
    --out="/tmp/backup_${TIMESTAMP}"

  # Copy backup from container to host
  docker cp "${MONGO_CONTAINER}:/tmp/backup_${TIMESTAMP}" "$BACKUP_PATH"

  # Cleanup temp in container
  docker exec "$MONGO_CONTAINER" rm -rf "/tmp/backup_${TIMESTAMP}"
else
  log "Using local mongodump..."
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH"
fi

# Compress backup
log "Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Backup compressed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Upload to S3 (if not local-only)
if [[ "$LOCAL_ONLY" != "--local-only" ]]; then
  if command -v aws &> /dev/null; then
    log "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/"
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}.tar.gz" \
      --region "$AWS_REGION" \
      --storage-class STANDARD_IA
    log "S3 upload completed"

    # Cleanup old S3 backups (keep last 30 days)
    log "Cleaning old S3 backups (>${RETENTION_DAYS} days)..."
    CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +"%Y-%m-%d" 2>/dev/null || date -v-${RETENTION_DAYS}d +"%Y-%m-%d")
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --region "$AWS_REGION" | while read -r line; do
      FILE_DATE=$(echo "$line" | awk '{print $1}')
      FILE_NAME=$(echo "$line" | awk '{print $4}')
      if [[ -n "$FILE_NAME" && "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
        aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}" --region "$AWS_REGION"
        log "Deleted old S3 backup: ${FILE_NAME}"
      fi
    done
  else
    warn "AWS CLI not installed - skipping S3 upload"
    warn "Install with: apt install awscli && aws configure"
  fi
fi

# Cleanup old local backups
log "Cleaning local backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "booking-engine_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(ls -1 "${BACKUP_DIR}"/booking-engine_*.tar.gz 2>/dev/null | wc -l)
log "Local backups remaining: ${REMAINING}"

# Summary
echo ""
log "========================================="
log "  Backup completed successfully!"
log "  File: ${BACKUP_FILE}"
log "  Size: ${BACKUP_SIZE}"
log "  Retention: ${RETENTION_DAYS} days"
log "========================================="
