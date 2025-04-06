// Fetch history data when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  updateSyncStatus();
  
  // Set up refresh button if it exists
  const refreshButton = document.getElementById('refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      loadHistory();
      updateSyncStatus();
    });
  }
  
  // Set up force sync button if it exists
  const forceSyncButton = document.getElementById('force-sync');
  if (forceSyncButton) {
    forceSyncButton.addEventListener('click', () => {
      browser.runtime.sendMessage({ action: 'forceSync' })
        .then(() => {
          updateSyncStatus();
          setTimeout(loadHistory, 1000); // Reload history after a short delay
        });
    });
  }
});

// Load history from the background script
function loadHistory() {
  browser.runtime.sendMessage({ action: 'getHistory', limit: 50 })
    .then(response => {
      if (response.success) {
        displayHistory(response.history);
      } else {
        console.error('Failed to load history:', response.error);
        document.getElementById('history-list').innerHTML = 
          `<div class="history-item">Error loading history: ${response.error}</div>`;
      }
    })
    .catch(error => {
      console.error('Error communicating with background script:', error);
      document.getElementById('history-list').innerHTML = 
        `<div class="history-item">Error communicating with background script</div>`;
    });
}

// Display history items in the popup
function displayHistory(historyItems) {
  const historyList = document.getElementById('history-list');
  
  if (!historyItems || historyItems.length === 0) {
    historyList.innerHTML = '<div class="history-item">No history items yet</div>';
    return;
  }
  
  historyList.innerHTML = '';
  
  historyItems.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = item.title || 'Untitled';
    
    const url = document.createElement('div');
    url.className = 'history-url';
    url.textContent = item.url;
    
    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = new Date(item.timestamp).toLocaleString();
    
    historyItem.appendChild(title);
    historyItem.appendChild(url);
    historyItem.appendChild(time);
    
    historyList.appendChild(historyItem);
  });
}

// Update sync status in the popup
function updateSyncStatus() {
  browser.runtime.sendMessage({ action: 'getSyncStatus' })
    .then(response => {
      if (response.success) {
        const status = response.status;
        
        // Update status text
        document.getElementById('sync-status').textContent = 
          status.initialized ? 'Connected' : 'Disconnected';
        
        // Update peer count
        document.getElementById('peer-count').textContent = status.peerCount;
        
        // Update last sync time if available
        const lastSyncElement = document.getElementById('last-sync-time');
        if (lastSyncElement && status.lastSyncTime) {
          lastSyncElement.textContent = new Date(status.lastSyncTime).toLocaleString();
        } else if (lastSyncElement) {
          lastSyncElement.textContent = 'Never';
        }
      }
    })
    .catch(error => {
      console.error('Error getting sync status:', error);
      document.getElementById('sync-status').textContent = 'Error';
    });
}