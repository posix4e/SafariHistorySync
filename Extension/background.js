// Import our shared SyncEngine
// Note: In a real Safari extension, we'd need to bundle these dependencies
// This is a simplified version for demonstration
const SyncEngine = require('../Shared/sync-engine');

// Initialize our sync engine
const syncEngine = new SyncEngine('./history-storage');
let syncStatus = {
  initialized: false,
  peerCount: 0,
  lastSyncTime: null
};

// Initialize the P2P network
async function initializeP2P() {
  if (syncStatus.initialized) return;
  
  try {
    await syncEngine.initialize();
    
    // Set up event listeners
    syncEngine.onPeerConnect((peerInfo) => {
      console.log('New peer connected:', peerInfo.id);
      syncStatus.peerCount = syncEngine.getPeerCount();
      updateBadge();
    });
    
    syncEngine.onPeerDisconnect((peerInfo) => {
      console.log('Peer disconnected:', peerInfo.id);
      syncStatus.peerCount = syncEngine.getPeerCount();
      updateBadge();
    });
    
    syncEngine.onSyncComplete((peerInfo) => {
      console.log('Sync completed with peer:', peerInfo.id);
      syncStatus.lastSyncTime = Date.now();
    });
    
    syncStatus.initialized = true;
    console.log('P2P network initialized');
  } catch (error) {
    console.error('Failed to initialize P2P network:', error);
  }
}

// Update the extension badge to show peer count
function updateBadge() {
  if (syncStatus.peerCount > 0) {
    browser.action.setBadgeText({ text: syncStatus.peerCount.toString() });
    browser.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    browser.action.setBadgeText({ text: '' });
  }
}

// Track browser history
async function trackVisit(url, title, timestamp) {
  if (!syncStatus.initialized) await initializeP2P();
  
  try {
    await syncEngine.addHistoryItem(url, title, timestamp);
    console.log('Tracked visit:', url);
  } catch (error) {
    console.error('Failed to track visit:', error);
  }
}

// Listen for tab updates to track history
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Don't track browser extension pages
    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('safari-extension://')) {
      trackVisit(tab.url, tab.title || '', Date.now());
    }
  }
});

// Initialize when the extension loads
initializeP2P();

// Get history from the sync engine
async function getHistory(limit = 100) {
  if (!syncStatus.initialized) await initializeP2P();
  return await syncEngine.getHistory(limit);
}

// Get sync status for the popup
function getSyncStatus() {
  return {
    initialized: syncStatus.initialized,
    peerCount: syncStatus.peerCount,
    lastSyncTime: syncStatus.lastSyncTime
  };
}

// Handle extension messages
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getHistory') {
    getHistory(message.limit)
      .then(history => sendResponse({ success: true, history }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
  
  if (message.action === 'getSyncStatus') {
    sendResponse({ success: true, status: getSyncStatus() });
    return false; // Synchronous response
  }
  
  if (message.action === 'forceSync') {
    // In a real implementation, we might trigger a manual sync here
    sendResponse({ success: true, message: 'Sync initiated' });
    return false;
  }
});