const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const reloadButton = document.getElementById('reload');
const goButton = document.getElementById('go');
const urlInput = document.getElementById('urlInput');
const iframe = document.getElementById('webview');
const debugButton = document.getElementById('debug');

const INITIAL_URL = 'https://www.cryptopro.ru/sites/default/files/products/cades/demopage/cades_bes_sample.html';
const HOME_URL = 'https://example.org';

let history = [];
let historyIndex = -1;

const MAX_LOG_ENTRIES = 1000;
let debugWindow = null;
let debugLogContainer = null;
const logEntries = [];

const renderLogs = () => {
  if (!debugWindow || debugWindow.closed || !debugLogContainer) {
    return;
  }
  debugLogContainer.textContent = logEntries.join('\n');
  debugLogContainer.scrollTop = debugLogContainer.scrollHeight;
};

const appendLog = (message) => {
  const normalizedMessage =
    typeof message === 'string' ? message : message ? JSON.stringify(message, null, 2) : String(message);
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${normalizedMessage}`;
  logEntries.push(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
  }
  if (debugWindow && debugWindow.closed) {
    debugWindow = null;
    debugLogContainer = null;
  }
  renderLogs();
};

const openDebugWindow = () => {
  if (debugWindow && !debugWindow.closed) {
    appendLog('Focusing existing debug window');
    debugWindow.focus();
    return;
  }

  appendLog('Opening debug window');
  debugWindow = window.open('', 'sferra-debug-logs', 'width=480,height=640,resizable=yes,scrollbars=yes');
  if (!debugWindow) {
    appendLog('Unable to open debug window (popup may be blocked).');
    return;
  }

  const doc = debugWindow.document;
  doc.title = 'Debug Logs';

  const head = doc.head || doc.createElement('head');
  if (!doc.head) {
    doc.documentElement.insertBefore(head, doc.body || null);
  }
  head.innerHTML = '';
  const body = doc.body || doc.createElement('body');
  if (!doc.body) {
    doc.documentElement.appendChild(body);
  }
  body.innerHTML = '';

  const style = doc.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      font-family: monospace;
      background: #111;
      color: #0f0;
    }
    #logContainer {
      box-sizing: border-box;
      padding: 12px;
      white-space: pre-wrap;
      overflow-y: auto;
      height: 100vh;
    }
  `;
  head.appendChild(style);

  debugLogContainer = doc.createElement('div');
  debugLogContainer.id = 'logContainer';
  body.appendChild(debugLogContainer);

  debugWindow.addEventListener('beforeunload', () => {
    appendLog('Debug window closed');
    debugWindow = null;
    debugLogContainer = null;
  });

  renderLogs();
};

const updateNavButtons = () => {
  backButton.disabled = historyIndex <= 0;
  forwardButton.disabled = historyIndex === -1 || historyIndex >= history.length - 1;
};

const normalizeUrl = (value) => {
  if (!value) {
    return HOME_URL;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return HOME_URL;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) {
    return trimmed;
  }
  const normalized = `https://${trimmed}`;
  appendLog(`Normalized URL by applying https:// prefix -> ${normalized}`);
  return normalized;
};

const navigate = (url, replace = false) => {
  if (!url) {
    return;
  }
  if (replace && historyIndex >= 0) {
    history[historyIndex] = url;
  } else {
    history = history.slice(0, historyIndex + 1);
    history.push(url);
    historyIndex = history.length - 1;
  }
  appendLog(`Navigating to ${url}`);
  iframe.src = url;
  urlInput.value = url;
  updateNavButtons();
  appendLog(`History snapshot -> index=${historyIndex}, total=${history.length}`);
};

backButton.addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex -= 1;
    const url = history[historyIndex];
    appendLog(`Going back to ${url}`);
    iframe.src = url;
    urlInput.value = url;
    updateNavButtons();
    appendLog(`History snapshot -> index=${historyIndex}, total=${history.length}`);
  }
});

forwardButton.addEventListener('click', () => {
  if (historyIndex !== -1 && historyIndex < history.length - 1) {
    historyIndex += 1;
    const url = history[historyIndex];
    appendLog(`Going forward to ${url}`);
    iframe.src = url;
    urlInput.value = url;
    updateNavButtons();
    appendLog(`History snapshot -> index=${historyIndex}, total=${history.length}`);
  }
});

reloadButton.addEventListener('click', () => {
  if (historyIndex !== -1) {
    const url = history[historyIndex];
    appendLog(`Reloading ${url}`);
    iframe.src = url;
  }
});

goButton.addEventListener('click', () => {
  const url = normalizeUrl(urlInput.value);
  navigate(url);
});

urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const url = normalizeUrl(urlInput.value);
    navigate(url);
  }
});

updateNavButtons();
if (debugButton) {
  debugButton.addEventListener('click', openDebugWindow);
} else {
  console.warn('Debug button element is missing.');
}

iframe.addEventListener('load', () => {
  appendLog(`Page loaded: ${iframe.src}`);
  try {
    const performance = iframe.contentWindow?.performance;
    if (performance) {
      const [navigationEntry] =
        typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('navigation') : [];
      if (navigationEntry) {
        appendLog(
          `Navigation timing -> domContentLoaded=${Math.round(navigationEntry.domContentLoadedEventEnd)}ms, load=${Math.round(
            navigationEntry.loadEventEnd
          )}ms`
        );
      } else if (performance.timing) {
        const { domContentLoadedEventEnd, loadEventEnd } = performance.timing;
        if (domContentLoadedEventEnd || loadEventEnd) {
          appendLog(
            `Legacy timing -> domContentLoaded=${domContentLoadedEventEnd}ms, load=${loadEventEnd}ms`
          );
        }
      }
    }
  } catch (error) {
    appendLog(`Unable to access performance metrics: ${error?.message || error}`);
  }
});

iframe.addEventListener('error', () => {
  appendLog(`Error while loading: ${iframe.src}`);
});

if (window.desktopAPI?.onDebugLog) {
  const removeDebugLogListener = window.desktopAPI.onDebugLog((message) => {
    if (!message) {
      return;
    }
    appendLog(message);
  });

  window.addEventListener('beforeunload', () => {
    if (typeof removeDebugLogListener === 'function') {
      removeDebugLogListener();
    }
  });
  appendLog('Subscribed to main-process debug log stream');
} else {
  const warningMessage = 'Debug logging bridge is not available in renderer context.';
  console.warn(warningMessage);
  appendLog(warningMessage);
}

window.addEventListener('online', () => {
  appendLog('Network status changed -> online');
});

window.addEventListener('offline', () => {
  appendLog('Network status changed -> offline');
});

appendLog(`Network status initial -> ${navigator.onLine ? 'online' : 'offline'}`);
appendLog('Application started');
navigate(INITIAL_URL);
