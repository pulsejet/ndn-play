const debuggers = new Map();

const onDebugEvent = (iframe, tabId) => (source, method, params) => {
  if (tabId !== source.tabId) return;

  if (method === "Network.webSocketFrameReceived") {
    iframe.contentWindow.postMessage({
      type: 'recv-packet',
      packet: params.response.payloadData,
      timestamp: params.timestamp * 1000,
    }, '*');
  } else if (method === "Network.webSocketFrameSent") {
    iframe.contentWindow.postMessage({
      type: 'send-packet',
      packet: params.response.payloadData,
      timestamp: params.timestamp * 1000,
    }, '*');
  }
}

async function attachDebugger(tabId, document) {
  // attach debugger
  await chrome.debugger.attach({ tabId }, "1.3");
  if (chrome.runtime.lastError) {
    alert('Error:', chrome.runtime.lastError.message);
    return;
  }

  // enable network events
  await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
  if (chrome.runtime.lastError) {
    alert('Error:', chrome.runtime.lastError.message);
    return;
  }

  // on detach, remove debugger
  chrome.debugger.onDetach.addListener((source, reason) => {
    if (tabId !== source.tabId) return;

    // remove old debugger
    if (debuggers.has(tabId)) {
      chrome.debugger.onEvent.removeListener(debuggers.get(tabId));
      debuggers.delete(tabId);
    }
  });

  // get target NDN Play instance
  const iframe = document.getElementById("main");

  // remove old debugger
  if (debuggers.has(tabId)) {
    chrome.debugger.onEvent.removeListener(debuggers.get(tabId));
  }

  // make new debugger
  const dbg = onDebugEvent(iframe, tabId);
  debuggers.set(tabId, dbg);

  // add event listener
  chrome.debugger.onEvent.addListener(dbg);
};

function onLoad(document, callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

chrome.devtools.panels.create("NDN-Play", "logo.png", "play.html", function (panel) {
  const tabId = chrome.devtools.inspectedWindow.tabId;

  panel.onShown.addListener(function (window) {
    onLoad(window.document, async function() {
      // check if debugger is already attached
      if (debuggers.has(tabId)) return;

      try {
        await attachDebugger(tabId, window.document);
      } catch (e) {
        alert('Error attaching debugger');
        console.error(e);
      }

      // detach debugger when panel is closed
      window.addEventListener('beforeunload', async () => {
        await chrome.debugger.detach({ tabId });
      });
    });
  });
});
