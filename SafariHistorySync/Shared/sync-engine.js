const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const Hyperswarm = require('hyperswarm');
const b4a = require('b4a');

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
      // Create a hypercore for storing our history data
      this.core = new Hypercore(this.storagePath);
      
      // Create a Hyperbee database on top of the hypercore
      this.db = new Hyperbee(this.core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
      });
      
      // Wait for the database to be ready
      await this.db.ready();
      
      // Join the P2P network
      this.swarm = new Hyperswarm();
      
      // Generate a topic for discovery based on a known string
      const topic = b4a.from('safari-history-sync-network', 'utf-8');
      
      // Join the swarm with our topic
      this.swarm.join(topic, { server: true, client: true });
      
      // Listen for new connections
      this.swarm.on('connection', (connection, info) => {
        const peerInfo = {
          id: connection.remotePublicKey.toString('hex'),
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
      });
      
      this.isInitialized = true;
      console.log('SyncEngine initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize SyncEngine:', error);
      return false;
    }
  }
  
  async addHistoryItem(url, title, timestamp) {
    if (!this.isInitialized) await this.initialize();
    
    try {
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
      const historyIndex = this.db.sub('history');
      const history = [];
      
      for await (const { key, value } of historyIndex.createReadStream({ reverse: true, limit })) {
        history.push(value);
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
      if (this.swarm) {
        this.swarm.destroy();
      }
      
      if (this.core) {
        await this.core.close();
      }
      
      this.isInitialized = false;
      console.log('SyncEngine closed');
    } catch (error) {
      console.error('Error closing SyncEngine:', error);
    }
  }
}

module.exports = SyncEngine;