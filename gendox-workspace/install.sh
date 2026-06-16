#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_PATH="$SCRIPT_DIR/../sdks/gendox-python-sdk"

if [ ! -d "$SDK_PATH" ]; then
    echo "ERROR: SDK not found at $SDK_PATH"
    echo "Make sure this folder is inside the gendox-core repo."
    exit 1
fi

echo "Installing Gendox SDK..."
pip3 install -e "$SDK_PATH"

echo ""
echo "Verifying..."
gendox --help

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete!"
echo ""
echo "  1. Copy and fill in your credentials:"
echo "       cp .env.example .env"
echo ""
echo "  2. Drop files into input/ and run:"
echo "       gendox digitize"
echo "       # or: ./run.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
