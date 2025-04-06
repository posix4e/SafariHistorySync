const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    background: './SafariHistorySyncExtension/Resources/background.js',
    popup: './SafariHistorySyncExtension/Resources/popup.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      "crypto": false,
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "os": require.resolve("os-browserify/browser"),
      "sodium-native": false,
      "utp-native": false,
      "leveldown": false,
      "sodium-universal": false
    },
    alias: {
      'sodium-native': 'sodium-javascript',
      'sodium-universal': 'sodium-javascript'
    }
  },
  plugins: [
    // Provide polyfills for Node.js globals
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    // Ignore native modules
    new webpack.IgnorePlugin({
      resourceRegExp: /sodium-native|utp-native|leveldown/
    })
  ],
  experiments: {
    topLevelAwait: true
  }
};