browser.devtools.panels.create("NDN-Play", "logo.png", "play.html").then((panel) => {
	const tabId = browser.devtools.inspectedWindow.tabId;
	let port = null;

	panel.onShown.addListener(function(window) {
		// Only connect once
		if (port) return;

		// Connect to the background script
		port = browser.runtime.connect({ name: "devtools" });

		// Tell background script which tab we are inspecting
		port.postMessage({ type: 'init', tabId: tabId });

		// Listen for WebSocket messages forwarded by the background script
		port.onMessage.addListener((msg) => {
			const iframe = window.document.getElementById("main");
			if (!iframe) return;

			if (msg.direction === 'recv') {
				iframe.contentWindow.postMessage({
					type: 'recv-packet',
					packet: msg.payload,
					timestamp: msg.timestamp,
				}, '*');
			} else if (msg.direction === 'send') {
				iframe.contentWindow.postMessage({
					type: 'send-packet',
					packet: msg.payload,
					timestamp: msg.timestamp,
				}, '*');
			}
		});

		// Handle cleanup if the panel is closed (optional, but good practice)
		window.addEventListener('beforeunload', () => {
			if (port) {
				port.disconnect();
				port = null;
			}
		});
	});
});
