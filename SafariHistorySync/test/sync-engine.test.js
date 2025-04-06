const SyncEngine = require('../Shared/sync-engine');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('SyncEngine', () => {
  let syncEngine;
  let tempDir;
  
  beforeEach(() => {
    // Create a unique temporary directory for each test
    tempDir = path.join(os.tmpdir(), `sync-engine-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    syncEngine = new SyncEngine(tempDir);
  });
  
  afterEach(async () => {
    // Clean up after each test
    if (syncEngine) {
      await syncEngine.close();
    }
    
    // Remove the temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  test('should initialize successfully', async () => {
    const result = await syncEngine.initialize();
    expect(result).toBe(true);
    expect(syncEngine.isInitialized).toBe(true);
  });
  
  test('should add and retrieve history items', async () => {
    await syncEngine.initialize();
    
    const testItem = {
      url: 'https://example.com',
      title: 'Example Domain',
      timestamp: Date.now()
    };
    
    // Add the item
    const addResult = await syncEngine.addHistoryItem(
      testItem.url,
      testItem.title,
      testItem.timestamp
    );
    
    expect(addResult).toBe(true);
    
    // Retrieve history
    const history = await syncEngine.getHistory();
    
    expect(history.length).toBe(1);
    expect(history[0].url).toBe(testItem.url);
    expect(history[0].title).toBe(testItem.title);
    expect(history[0].timestamp).toBe(testItem.timestamp);
  });
  
  test('should respect the limit when retrieving history', async () => {
    await syncEngine.initialize();
    
    // Add multiple items
    for (let i = 0; i < 10; i++) {
      await syncEngine.addHistoryItem(
        `https://example.com/${i}`,
        `Example ${i}`,
        Date.now() + i
      );
    }
    
    // Retrieve with limit
    const history = await syncEngine.getHistory(5);
    
    expect(history.length).toBe(5);
  });
  
  test('should track peer count correctly', async () => {
    await syncEngine.initialize();
    
    // Initially there should be no peers
    expect(syncEngine.getPeerCount()).toBe(0);
    
    // We can't easily test peer connections in a unit test,
    // but we can test the event callbacks
    
    // Simulate a peer connect event
    const mockPeerInfo = { id: 'test-peer-id', client: true };
    syncEngine.peers.add(mockPeerInfo.id);
    
    expect(syncEngine.getPeerCount()).toBe(1);
    
    // Simulate a peer disconnect
    syncEngine.peers.delete(mockPeerInfo.id);
    
    expect(syncEngine.getPeerCount()).toBe(0);
  });
  
  test('should call event callbacks', async () => {
    await syncEngine.initialize();
    
    // Set up mock callbacks
    const onPeerConnectMock = jest.fn();
    const onPeerDisconnectMock = jest.fn();
    const onSyncCompleteMock = jest.fn();
    
    syncEngine.onPeerConnect(onPeerConnectMock);
    syncEngine.onPeerDisconnect(onPeerDisconnectMock);
    syncEngine.onSyncComplete(onSyncCompleteMock);
    
    // Simulate events
    const mockPeerInfo = { id: 'test-peer-id', client: true };
    
    syncEngine._notifyPeerConnect(mockPeerInfo);
    syncEngine._notifyPeerDisconnect(mockPeerInfo);
    syncEngine._notifySyncComplete(mockPeerInfo);
    
    // Check that callbacks were called
    expect(onPeerConnectMock).toHaveBeenCalledWith(mockPeerInfo);
    expect(onPeerDisconnectMock).toHaveBeenCalledWith(mockPeerInfo);
    expect(onSyncCompleteMock).toHaveBeenCalledWith(mockPeerInfo);
  });
});