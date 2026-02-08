#!/bin/bash
# Export all n8n workflows via Docker exec + n8n CLI
# Usage: ./scripts/export-workflows.sh [CONTAINER_NAME]

CONTAINER="${1:-n8n-node}"
EXPORT_PATH="/home/node/workflows"
OUTPUT_DIR="$(cd "$(dirname "$0")/../workflows" && pwd)"

mkdir -p "$OUTPUT_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Error: Container '$CONTAINER' is not running."
  echo "Running containers:"
  docker ps --format '  {{.Names}}'
  exit 1
fi

echo "Exporting workflows from container '$CONTAINER' ..."

# Clean target dir inside container
docker exec "$CONTAINER" sh -c "rm -rf ${EXPORT_PATH}/*.json"

# Export all workflows as separate files into the mounted volume
# Volume maps directly to n8n/workflows/ on the host
docker exec "$CONTAINER" n8n export:workflow --all --separate --output="$EXPORT_PATH"

if [ $? -ne 0 ]; then
  echo "Error: Export failed."
  exit 1
fi

COUNT=$(ls -1 "$OUTPUT_DIR"/*.json 2>/dev/null | wc -l)
echo "Done. $COUNT workflow(s) exported to $OUTPUT_DIR"
