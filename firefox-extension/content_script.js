// Inject a script tag to run in the page context (main world)
const script = document.createElement('script');
script.textContent = `
(() => {
    const OriginalWebSocket = window.WebSocket;

    // Helper to encode ArrayBuffer to Base64
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    class HookedWebSocket extends OriginalWebSocket {
        constructor(url, protocols) {
            super(url, protocols);
            
            this.addEventListener('message', (event) => {
                let payload = event.data;
                
                // Convert binary to base64 for transport
                if (payload instanceof ArrayBuffer) {
                    payload = arrayBufferToBase64(payload);
                } else if (payload instanceof Blob) {
                     const reader = new FileReader();
                     reader.onload = () => {
                         const b64 = reader.result.split(',')[1];
                         window.postMessage({
                            type: 'NDN-PLAY-WS',
                            direction: 'recv',
                            payload: b64,
                            timestamp: Date.now()
                        }, '*');
                     };
                     reader.readAsDataURL(payload);
                     return;
                }
                
                window.postMessage({
                    type: 'NDN-PLAY-WS',
                    direction: 'recv',
                    payload: payload,
                    timestamp: Date.now()
                }, '*');
            });
        }
        
        send(data) {
             let payload = data;
             // Convert binary to base64
             if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                  payload = arrayBufferToBase64(data.buffer || data);
             }
             
             window.postMessage({
                type: 'NDN-PLAY-WS',
                direction: 'send',
                payload: payload,
                timestamp: Date.now()
            }, '*');
            return super.send(data);
        }
    }
    
    // Overwrite the native WebSocket
    window.WebSocket = HookedWebSocket;
})();
`;

(document.head || document.documentElement).appendChild(script);
script.remove();

// Listen for messages from the injected script and forward to background
window.addEventListener('message', (event) => {
	if (event.source !== window) return;
	if (event.data && event.data.type === 'NDN-PLAY-WS') {
		browser.runtime.sendMessage(event.data);
	}
});
