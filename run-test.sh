#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing dependencies..."
pnpm install

echo "🧪 Running tests with Vitest..."
NODE_ENV=test pnpm vitest run --passWithNoTests
