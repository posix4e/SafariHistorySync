const path = require('path');

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
      "os": require.resolve("os-browserify/browser")
    }
  },
  experiments: {
    topLevelAwait: true
  }
};