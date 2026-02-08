#!/bin/bash
# Export all n8n workflows via Docker exec + n8n CLI
# Usage: ./scripts/export-workflows.sh [CONTAINER_NAME]

CONTAINER="${1:-n8n-node}"
EXPORT_PATH="/home/node/workflows"
OUTPUT_DIR="$(cd "$(dirname "$0")/../workflows" && pwd)"

# Prevent Git Bash from mangling Linux paths passed to docker exec
export MSYS_NO_PATHCONV=1

mkdir -p "$OUTPUT_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Error: Container '$CONTAINER' is not running."
  echo "Running containers:"
  docker ps --format '  {{.Names}}'
  exit 1
fi

echo "Exporting workflows from container '$CONTAINER' ..."

# Clean local output dir and container export dir
rm -f "$OUTPUT_DIR"/*.json 2>/dev/null
docker exec "$CONTAINER" sh -c "rm -f ${EXPORT_PATH}/*.json 2>/dev/null; true"
docker exec "$CONTAINER" n8n export:workflow --all --separate --output="$EXPORT_PATH"

if [ $? -ne 0 ]; then
  echo "Error: Export failed."
  exit 1
fi

# List exported files, copy to host with workflow name as filename
COUNT=0
FILES=$(docker exec "$CONTAINER" find "$EXPORT_PATH" -name '*.json' -type f)

for FILE in $FILES; do
  # Read workflow name from JSON
  NAME=$(docker exec "$CONTAINER" cat "$FILE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$NAME" ]; then
    # Sanitize: replace spaces/slashes with dashes
    FILENAME=$(echo "$NAME" | tr ' /' '--')
  else
    FILENAME=$(basename "$FILE" .json)
  fi
  docker exec "$CONTAINER" cat "$FILE" > "$OUTPUT_DIR/${FILENAME}.json"
  COUNT=$((COUNT + 1))
  echo "  -> ${FILENAME}.json"
done

echo "Done. $COUNT workflow(s) exported to $OUTPUT_DIR"
