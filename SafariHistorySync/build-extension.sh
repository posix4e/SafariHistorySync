#!/bin/bash

# Set the working directory to the project root
cd "$(dirname "$0")"

# Install dependencies
npm install

# Build the extension
npm run build

# Create directories if they don't exist
mkdir -p SafariHistorySyncExtension/Resources

# Copy bundled files to the extension
cp dist/background.bundle.js SafariHistorySyncExtension/Resources/
cp dist/popup.bundle.js SafariHistorySyncExtension/Resources/

# Copy other necessary files if they don't already exist in the destination
if [ ! -f "SafariHistorySyncExtension/Resources/popup.html" ]; then
  cp SafariHistorySyncExtension/Resources/popup.html SafariHistorySyncExtension/Resources/
fi

if [ ! -d "SafariHistorySyncExtension/Resources/images" ]; then
  cp -r SafariHistorySyncExtension/Resources/images SafariHistorySyncExtension/Resources/
fi

if [ ! -f "SafariHistorySyncExtension/Resources/manifest.json" ]; then
  cp SafariHistorySyncExtension/Resources/manifest.json SafariHistorySyncExtension/Resources/
fi

echo "Extension files copied to Xcode project"

# Run tests if the test flag is provided
if [ "$1" == "--test" ]; then
  npm test
fi