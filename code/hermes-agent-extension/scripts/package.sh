#!/bin/bash
# ============================================
# Package Script for Extension Marketplace
# ============================================

set -e

VERSION=${1:-1.0.0}
OUTPUT="hermes-agent-${VERSION}.nimext"

echo "Packaging Hermes Agent Extension v${VERSION}..."

# Build first
./scripts/build.sh

# Create package with manifest
echo "Creating marketplace package..."
mkdir -p package/
cp manifest.json package/
cp -r dist/ package/

# Screenshots (if available)
if [ -d "screenshots" ]; then
  cp -r screenshots/ package/
fi

# Create .nimext
cd package/
zip -r ../${OUTPUT} .
cd ..

# Cleanup
rm -rf package/

echo "Package created: ${OUTPUT}"
echo "Size: $(du -h ${OUTPUT} | cut -f1)"
