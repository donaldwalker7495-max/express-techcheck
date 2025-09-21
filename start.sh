#!/usr/bin/env bash
set -euo pipefail

echo "🐳 Building Docker images..."
docker compose build

echo "🚀 Starting containers..."
docker compose up -d

echo "✅ App is running at http://localhost:3000"
