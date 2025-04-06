import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    private let logger = Logger(subsystem: "com.example.SafariHistorySync", category: "Extension")
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        logger.log("Received message from browser.runtime.sendNativeMessage: \(message ?? [:])")
        
        // Handle different message types
        if let action = message?["action"] as? String {
            switch action {
            case "getDeviceInfo":
                handleGetDeviceInfo(context: context)
            case "saveHistoryItem":
                if let historyItem = message?["historyItem"] as? [String: Any] {
                    handleSaveHistoryItem(historyItem: historyItem, context: context)
                } else {
                    sendResponse(["success": false, "error": "Missing history item data"], context: context)
                }
            case "syncStatus":
                handleSyncStatus(context: context)
            default:
                // Unknown action
                sendResponse(["success": false, "error": "Unknown action: \(action)"], context: context)
            }
        } else {
            // No action specified
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message" ] ]
            context.completeRequest(returningItems: [response], completionHandler: nil)
        }
    }
    
    private func handleGetDeviceInfo(context: NSExtensionContext) {
        let deviceName = UIDevice.current.name
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        let systemVersion = UIDevice.current.systemVersion
        
        sendResponse([
            "success": true,
            "deviceInfo": [
                "name": deviceName,
                "id": deviceId,
                "systemVersion": systemVersion
            ]
        ], context: context)
    }
    
    private func handleSaveHistoryItem(historyItem: [String: Any], context: NSExtensionContext) {
        // In a real implementation, we would save the history item to a local database
        // For now, we'll just log it and return success
        logger.log("Saving history item: \(historyItem)")
        
        sendResponse(["success": true], context: context)
    }
    
    private func handleSyncStatus(context: NSExtensionContext) {
        // In a real implementation, we would check the sync status
        // For now, we'll just return a mock status
        sendResponse([
            "success": true,
            "status": [
                "lastSync": Date().timeIntervalSince1970,
                "peerCount": 0,
                "isConnected": true
            ]
        ], context: context)
    }
    
    private func sendResponse(_ response: [String: Any], context: NSExtensionContext) {
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [ SFExtensionMessageKey: response ]
        context.completeRequest(returningItems: [responseItem], completionHandler: nil)
    }
}