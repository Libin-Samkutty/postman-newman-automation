#!/bin/bash
# CI gate: fails if collections/*.json doesn't match what src/ would generate.
# Compares content with id/_postman_id stripped, since postman-collection assigns
# a fresh random UUID to every item/script/collection on each build.
set -e

BUILD_DIR=$(mktemp -d)
DIFF_FILE=$(mktemp)
trap 'rm -rf "$BUILD_DIR" "$DIFF_FILE"' EXIT

node scripts/build-collections.js "$BUILD_DIR"

status=0
for file in collections/*.json; do
  name=$(basename "$file")
  if ! diff -u \
      <(node scripts/normalize-collection.js "$file") \
      <(node scripts/normalize-collection.js "$BUILD_DIR/$name") > "$DIFF_FILE"; then
    echo "collections/${name} is out of sync with src/. Run 'npm run build:collections' and commit the result."
    cat "$DIFF_FILE"
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "collections/ is in sync with src/."
fi

exit $status
