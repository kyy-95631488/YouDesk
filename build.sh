#!/bin/bash
set -e

echo "=========================================="
echo "YouTube Desktop Multiplatform Build Script"
echo "=========================================="
echo ""

echo "Building the frontend assets..."
cd frontend
npm run build
cd ..

echo ""
echo "Building the Wails executable (Embedded UI)..."
# The wails build command automatically detects the host OS (Linux/macOS)
wails build -clean

echo ""
echo "========================================================="
echo "BUILD COMPLETE!"
echo "========================================================="
echo "You can find the standalone executable in the 'build/bin' folder."
echo "UI assets are fully embedded inside the executable."
echo "========================================================="
