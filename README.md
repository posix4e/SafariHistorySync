# Safari History Sync

A decentralized Safari iOS extension that tracks browser history and synchronizes it across devices using Holepunch.

## Features

- Track Safari browsing history
- Synchronize history across devices using peer-to-peer technology
- No central server required
- Privacy-focused design

## Architecture

The project consists of:

1. **iOS Host App**: A simple iOS app that serves as the container for the Safari extension
2. **Safari Extension**: The extension that tracks browser history and synchronizes it
3. **Shared Sync Engine**: A module that handles the decentralized synchronization using Holepunch

## Technology Stack

- **iOS/Swift**: For the host app and extension integration
- **JavaScript**: For the Safari extension logic
- **Holepunch**: For decentralized data synchronization
  - Hypercore: Append-only log for storing history data
  - Hyperbee: Key-value database built on Hypercore
  - Hyperswarm: P2P network for discovering and connecting to peers

## Development

### Prerequisites

- Xcode 14+ (for iOS development)
- Node.js 16+ (for JavaScript dependencies)
- Safari 14+ (for extension testing)

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Open the Xcode project and build the app

### Testing

Run the sync tests:

```
node test/sync-test.js
```

## How It Works

1. The Safari extension tracks page visits as they occur
2. Visit data is stored in a local Hypercore database
3. When other devices with the extension are online, they discover each other using Hyperswarm
4. History data is automatically synchronized between devices

## Security Considerations

This is a prototype and does not yet implement security features that would be necessary for a production app:

- Data encryption
- Authentication
- Access control
- Secure storage

## License

MIT