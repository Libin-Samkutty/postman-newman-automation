#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="reports/${TIMESTAMP}"
mkdir -p "${REPORT_DIR}"

npx newman run collections/regression.collection.json \
  --environment "environments/${ENVIRONMENT}.environment.json" \
  --reporters cli,htmlextra,junit \
  --reporter-htmlextra-export "${REPORT_DIR}/regression-report.html" \
  --reporter-htmlextra-title "HealthSaaS API Regression — ${ENVIRONMENT}" \
  --reporter-htmlextra-showOnlyFails \
  --reporter-htmlextra-logs \
  --reporter-junit-export "${REPORT_DIR}/junit-results.xml" \
  --bail
