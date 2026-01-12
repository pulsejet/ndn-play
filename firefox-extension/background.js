const connections = new Map();

// Handle connections from DevTools panels
browser.runtime.onConnect.addListener((port) => {
	if (port.name !== "devtools") return;

	const listener = (msg) => {
		if (msg.type === 'init' && msg.tabId) {
			connections.set(msg.tabId, port);

			port.onDisconnect.addListener(() => {
				connections.delete(msg.tabId);
			});
		}
	};

	port.onMessage.addListener(listener);
});

// Handle messages from Content Scripts
browser.runtime.onMessage.addListener((message, sender) => {
	if (sender.tab) {
		const tabId = sender.tab.id;
		if (connections.has(tabId)) {
			connections.get(tabId).postMessage(message);
		}
	}
});
