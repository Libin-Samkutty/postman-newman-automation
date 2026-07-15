#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="reports/${TIMESTAMP}"
mkdir -p "${REPORT_DIR}"

npx newman run collections/auth.collection.json \
  --environment "environments/${ENVIRONMENT}.environment.json" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export "${REPORT_DIR}/smoke-report.html" \
  --reporter-htmlextra-title "HealthSaaS API Smoke — ${ENVIRONMENT}"
