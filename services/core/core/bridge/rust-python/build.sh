#!/bin/bash
# Build PyO3 Python extension module

set -e

echo "Building Rust-Python bridge..."

# Build the extension
cargo build --release

# Copy to Python directory for testing
PYTHON_VERSION=$(python3 --version | awk '{print $2}' | cut -d. -f1,2)
TARGET_DIR="../../deai/lib"

mkdir -p "$TARGET_DIR"

# Find the built library
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LIB_NAME="libnakharax_python.so"
    cp "../../target/release/$LIB_NAME" "$TARGET_DIR/nakharax_python.so"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    LIB_NAME="libnakharax_python.dylib"
    cp "../../target/release/$LIB_NAME" "$TARGET_DIR/nakharax_python.so"
else
    LIB_NAME="nakharax_python.dll"
    cp "../../target/release/$LIB_NAME" "$TARGET_DIR/nakharax_python.pyd"
fi

echo "✅ Built and copied to $TARGET_DIR"
echo "✅ Python can now: import nakharax_python"
