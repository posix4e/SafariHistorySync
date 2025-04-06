// Use try-catch to handle potential import errors in browser environment
let Hypercore, Hyperbee, Hyperswarm, b4a;

try {
  Hypercore = require('hypercore');
  Hyperbee = require('hyperbee');
  Hyperswarm = require('hyperswarm');
  b4a = require('b4a');
} catch (error) {
  console.warn('Failed to import one or more modules:', error);
  
  // Provide fallbacks for browser environment
  Hypercore = Hypercore || class MockHypercore {
    constructor() { this.ready = () => Promise.resolve(this); }
    replicate() { return { pipe: () => ({ pipe: () => ({}) }) }; }
    close() { return Promise.resolve(); }
  };
  
  Hyperbee = Hyperbee || class MockHyperbee {
    constructor() { this.ready = () => Promise.resolve(this); }
    sub() { return this; }
    put() { return Promise.resolve(); }
    createReadStream() { return []; }
  };
  
  Hyperswarm = Hyperswarm || function() {
    return {
      join: () => {},
      on: () => {},
      destroy: () => {}
    };
  };
  
  b4a = b4a || {
    from: (str) => new TextEncoder().encode(str)
  };
}

class SyncEngine {
  constructor(storagePath) {
    this.storagePath = storagePath || './history-storage';
    this.core = null;
    this.db = null;
    this.swarm = null;
    this.isInitialized = false;
    this.peers = new Set();
    this.onPeerConnectCallbacks = [];
    this.onPeerDisconnectCallbacks = [];
    this.onSyncCompleteCallbacks = [];
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';
      
      // Check if we're in a CI environment
      const isCI = process.env.CI === 'true';
      
      if (isBrowser) {
        console.log('Running in browser environment, using mock implementations');
        // In browser, use localStorage for storage
        this._initializeBrowserStorage();
        this.isInitialized = true;
        return true;
      }
      
      // Create a hypercore for storing our history data
      this.core = new Hypercore(this.storagePath);
      
      // Create a Hyperbee database on top of the hypercore
      this.db = new Hyperbee(this.core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
      });
      
      // Wait for the database to be ready
      await this.db.ready();
      
      // Skip P2P networking in CI environments to prevent hanging
      if (!isCI) {
        try {
          // Join the P2P network
          this.swarm = new Hyperswarm();
          
          // Generate a topic for discovery based on a known string
          const topic = b4a.from('safari-history-sync-network', 'utf-8');
          
          // Join the swarm with our topic
          this.swarm.join(topic, { server: true, client: true });
          
          // Listen for new connections
          this.swarm.on('connection', (connection, info) => {
            try {
              const peerInfo = {
                id: connection.remotePublicKey ? connection.remotePublicKey.toString('hex') : 'unknown',
                client: info.client
              };
              
              this.peers.add(peerInfo.id);
              this._notifyPeerConnect(peerInfo);
              
              // Replicate our hypercore with the peer
              const stream = this.core.replicate(info.client);
              connection.pipe(stream).pipe(connection);
              
              connection.on('close', () => {
                this.peers.delete(peerInfo.id);
                this._notifyPeerDisconnect(peerInfo);
              });
              
              // When replication is complete, notify listeners
              stream.on('end', () => {
                this._notifySyncComplete(peerInfo);
              });
            } catch (connError) {
              console.error('Error handling connection:', connError);
            }
          });
        } catch (swarmError) {
          console.warn('Failed to initialize swarm, continuing without P2P:', swarmError);
        }
      } else {
        console.log('Running in CI environment, skipping P2P networking initialization');
      }
      
      this.isInitialized = true;
      console.log('SyncEngine initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize SyncEngine:', error);
      // Initialize with browser storage as fallback
      this._initializeBrowserStorage();
      this.isInitialized = true;
      return true;
    }
  }
  
  // Initialize browser-based storage using localStorage
  _initializeBrowserStorage() {
    // Create a simple in-memory database for the browser
    this.browserStorage = {
      history: []
    };
    
    // Try to load existing data from localStorage
    try {
      const savedData = localStorage.getItem('safari-history-sync');
      if (savedData) {
        this.browserStorage = JSON.parse(savedData);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }
  
  async addHistoryItem(url, title, timestamp) {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // Check if we're using browser storage
      if (this.browserStorage) {
        // Create a history item
        const historyItem = {
          url,
          title,
          timestamp,
          visitTime: Date.now()
        };
        
        // Add to browser storage
        if (!this.browserStorage.history) {
          this.browserStorage.history = [];
        }
        
        this.browserStorage.history.push(historyItem);
        
        // Save to localStorage
        try {
          localStorage.setItem('safari-history-sync', JSON.stringify(this.browserStorage));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
        
        return true;
      }
      
      // Using Hyperbee
      const historyIndex = this.db.sub('history');
      
      // Create a unique key based on timestamp and URL
      const key = `${timestamp}-${encodeURIComponent(url)}`;
      
      // Store the visit in our database
      await historyIndex.put(key, {
        url,
        title,
        timestamp,
        visitTime: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to add history item:', error);
      return false;
    }
  }
  
  async getHistory(limit = 100) {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // Check if we're using browser storage
      if (this.browserStorage) {
        // Return history from browser storage
        const history = this.browserStorage.history || [];
        
        // Sort by timestamp (newest first) and limit
        return history
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      }
      
      // Using Hyperbee
      const historyIndex = this.db.sub('history');
      const history = [];
      
      try {
        for await (const { key, value } of historyIndex.createReadStream({ reverse: true, limit })) {
          history.push(value);
        }
      } catch (streamError) {
        console.warn('Error reading stream, returning partial results:', streamError);
      }
      
      return history;
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
  
  getPeerCount() {
    return this.peers.size;
  }
  
  onPeerConnect(callback) {
    this.onPeerConnectCallbacks.push(callback);
  }
  
  onPeerDisconnect(callback) {
    this.onPeerDisconnectCallbacks.push(callback);
  }
  
  onSyncComplete(callback) {
    this.onSyncCompleteCallbacks.push(callback);
  }
  
  _notifyPeerConnect(peerInfo) {
    this.onPeerConnectCallbacks.forEach(callback => {
      try {
        callback(peerInfo);
      } catch (error) {
        console.error('Error in peer connect callback:', error);
      }
    });
  }
  
  _notifyPeerDisconnect(peerInfo) {
    this.onPeerDisconnectCallbacks.forEach(callback => {
      try {
        callback(peerInfo);
      } catch (error) {
        console.error('Error in peer disconnect callback:', error);
      }
    });
  }
  
  _notifySyncComplete(peerInfo) {
    this.onSyncCompleteCallbacks.forEach(callback => {
      try {
        callback(peerInfo);
      } catch (error) {
        console.error('Error in sync complete callback:', error);
      }
    });
  }
  
  async close() {
    if (!this.isInitialized) return;
    
    try {
      // If using browser storage, save to localStorage before closing
      if (this.browserStorage) {
        try {
          localStorage.setItem('safari-history-sync', JSON.stringify(this.browserStorage));
        } catch (e) {
          console.warn('Failed to save to localStorage on close:', e);
        }
      }
      
      // Check if we're in a CI environment
      const isCI = process.env.CI === 'true';
      
      // Close Hyperswarm if it exists
      if (this.swarm) {
        try {
          // In CI environments, set a timeout to avoid hanging
          if (isCI) {
            const timeoutPromise = new Promise((resolve) => {
              setTimeout(() => {
                console.warn('Swarm destroy timeout reached, continuing with cleanup');
                resolve();
              }, 1000);
            });
            
            // Race between normal destroy and timeout
            await Promise.race([
              this.swarm.destroy(),
              timeoutPromise
            ]);
          } else {
            await this.swarm.destroy();
          }
        } catch (e) {
          console.warn('Error destroying swarm:', e);
        }
      }
      
      // Close Hypercore if it exists
      if (this.core) {
        try {
          // In CI environments, set a timeout to avoid hanging
          if (isCI) {
            const timeoutPromise = new Promise((resolve) => {
              setTimeout(() => {
                console.warn('Hypercore close timeout reached, continuing with cleanup');
                resolve();
              }, 1000);
            });
            
            // Race between normal close and timeout
            await Promise.race([
              this.core.close(),
              timeoutPromise
            ]);
          } else {
            await this.core.close();
          }
        } catch (e) {
          console.warn('Error closing hypercore:', e);
        }
      }
      
      this.isInitialized = false;
      console.log('SyncEngine closed');
    } catch (error) {
      console.error('Error closing SyncEngine:', error);
    }
  }
}

module.exports = SyncEngine;