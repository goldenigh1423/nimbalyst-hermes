#!/bin/bash
# ============================================
# Build Script for Hermes Agent Extension
# ============================================

set -e

echo "Building Hermes Agent Extension..."

# Clean
rm -rf dist/

# Install dependencies
echo "Installing dependencies..."
npm install

# Type check
echo "Running type check..."
npx tsc --noEmit

# Build
echo "Building..."
npx vite build

# Copy manifest
echo "Copying manifest..."
cp manifest.json dist/

# Create .nimext package
echo "Creating .nimext package..."
cd dist/
zip -r ../hermes-agent-1.0.0.nimext .
cd ..

echo "Build complete!"
echo "Output: hermes-agent-1.0.0.nimext"
