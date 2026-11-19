#!/usr/bin/env bash
# Fetches Davis and KIBA datasets if not already present
set -euo pipefail

DATA_DIR="data"
mkdir -p "$DATA_DIR"

if [ -d "$DATA_DIR/davis" ] && [ -f "$DATA_DIR/davis/Y" ]; then
    echo "Davis dataset already present in $DATA_DIR/davis."
else
    echo "Cloning DeepDTA repository to extract data..."
    TMP_DIR=$(mktemp -d)
    git clone --depth 1 https://github.com/hkmztrk/DeepDTA "$TMP_DIR/DeepDTA"
    cp -r "$TMP_DIR/DeepDTA/data/davis" "$DATA_DIR/"
    if [ -d "$TMP_DIR/DeepDTA/data/kiba" ]; then
        cp -r "$TMP_DIR/DeepDTA/data/kiba" "$DATA_DIR/"
    fi
    rm -rf "$TMP_DIR"
    echo "Data fetched successfully."
fi
