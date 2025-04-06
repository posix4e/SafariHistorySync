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

# Copy other necessary files
cp -r SafariHistorySyncExtension/Resources/popup.html SafariHistorySyncExtension/Resources/
cp -r SafariHistorySyncExtension/Resources/images SafariHistorySyncExtension/Resources/
cp SafariHistorySyncExtension/Resources/manifest.json SafariHistorySyncExtension/Resources/

echo "Extension files copied to Xcode project"