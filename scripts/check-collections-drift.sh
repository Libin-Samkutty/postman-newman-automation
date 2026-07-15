#!/bin/bash
# CI gate: fails if collections/*.json doesn't match what src/ would generate.
set -e

node scripts/build-collections.js

if ! git diff --exit-code -- collections/ > /dev/null; then
  echo "collections/ is out of sync with src/. Run 'npm run build:collections' and commit the result."
  git diff -- collections/
  exit 1
fi

echo "collections/ is in sync with src/."
