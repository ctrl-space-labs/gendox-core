#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 run.py "$@"
