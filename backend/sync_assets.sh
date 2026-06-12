#!/usr/bin/env bash
# Deploy öncesi: canonical schemas/ ve examples/'ı backend'e kopyala (backend self-contained olsun).
set -e
cd "$(dirname "$0")"
rm -rf schemas examples
cp -r ../schemas schemas
cp -r ../examples examples
echo "backend/schemas ve backend/examples senkronlandı."
