const SyncEngine = require('../Shared/sync-engine');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Create temporary directories for our test instances
const tempDir1 = path.join(__dirname, 'temp-instance-1');
const tempDir2 = path.join(__dirname, 'temp-instance-2');

// Ensure the directories exist
if (!fs.existsSync(tempDir1)) {
  fs.mkdirSync(tempDir1, { recursive: true });
}

if (!fs.existsSync(tempDir2)) {
  fs.mkdirSync(tempDir2, { recursive: true });
}

// Create two instances of the sync engine
const syncEngine1 = new SyncEngine(tempDir1);
const syncEngine2 = new SyncEngine(tempDir2);

// Test data
const testData = [
  { url: 'https://example.com', title: 'Example Domain', timestamp: Date.now() },
  { url: 'https://test.com', title: 'Test Website', timestamp: Date.now() + 1000 },
  { url: 'https://github.com', title: 'GitHub', timestamp: Date.now() + 2000 }
];

// Flag to track when sync is complete
let syncCompleted = false;

// Run the test
async function runTest() {
  console.log('Initializing sync engines...');
  
  // Initialize both sync engines
  await syncEngine1.initialize();
  await syncEngine2.initialize();
  
  console.log('Adding test data to first instance...');
  
  // Add test data to the first instance
  for (const item of testData) {
    await syncEngine1.addHistoryItem(item.url, item.title, item.timestamp);
  }
  
  // Set up sync completion listener
  syncEngine2.onSyncComplete(() => {
    syncCompleted = true;
    console.log('Sync completed!');
  });
  
  // Wait for sync to complete (with timeout)
  console.log('Waiting for sync to complete...');
  await waitForSync(30000); // 30 second timeout
  
  // Verify the data was synced
  console.log('Verifying synced data...');
  const history1 = await syncEngine1.getHistory();
  const history2 = await syncEngine2.getHistory();
  
  console.log('Instance 1 history:', history1);
  console.log('Instance 2 history:', history2);
  
  // Check that the second instance has the same number of items
  assert.strictEqual(history2.length, testData.length, 'History length should match');
  
  // Check that all items were synced
  for (const item of testData) {
    const found = history2.some(h => h.url === item.url && h.title === item.title);
    assert.strictEqual(found, true, `Item ${item.url} should be synced`);
  }
  
  console.log('Test passed! Data was successfully synced between instances.');
  
  // Clean up
  await syncEngine1.close();
  await syncEngine2.close();
}

// Helper function to wait for sync with timeout
function waitForSync(timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkSync = () => {
      if (syncCompleted) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Sync timed out'));
      } else {
        setTimeout(checkSync, 500);
      }
    };
    
    checkSync();
  });
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});