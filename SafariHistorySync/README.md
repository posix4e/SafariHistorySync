# Safari History Sync

A decentralized Safari iOS extension that tracks browser history and synchronizes it across devices using Holepunch.

## Features

- Track Safari browsing history
- Synchronize history across devices using peer-to-peer technology
- No central server required
- Privacy-focused design

## Project Structure

- **SafariHistorySync**: The main iOS app that hosts the Safari extension
- **SafariHistorySyncExtension**: The Safari extension that tracks browser history
- **Shared**: Contains shared code used by both the app and extension

## Building the Project

1. Open the Xcode project
2. Install Node.js dependencies:
   ```
   cd /path/to/SafariHistorySync
   npm install
   ```
3. Build the extension JavaScript files:
   ```
   npm run build
   ```
4. Build and run the app in Xcode

## Testing the Extension

1. Build and run the app on your device or simulator
2. Open Safari
3. Go to Settings > Extensions
4. Enable the Safari History Sync extension
5. Browse to some websites to test history tracking
6. Click on the extension icon to see your history and sync status

## Development

### Prerequisites

- Xcode 14+
- Node.js 16+
- Safari 14+

### Modifying the Extension

If you modify the JavaScript files, you need to rebuild the extension:

1. Make your changes to the JavaScript files
2. Run `npm run build` to bundle the files
3. Build and run the app in Xcode

## How It Works

1. The Safari extension tracks page visits as they occur
2. Visit data is stored in a local Hypercore database
3. When other devices with the extension are online, they discover each other using Hyperswarm
4. History data is automatically synchronized between devices

## License

MIT