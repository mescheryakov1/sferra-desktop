const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const reloadButton = document.getElementById('reload');
const goButton = document.getElementById('go');
const urlInput = document.getElementById('urlInput');
const iframe = document.getElementById('webview');

const INITIAL_URL = 'https://www.cryptopro.ru/sites/default/files/products/cades/demopage/cades_bes_sample.html';
const HOME_URL = 'https://example.org';

let history = [];
let historyIndex = -1;

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
  return `https://${trimmed}`;
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
  iframe.src = url;
  urlInput.value = url;
  updateNavButtons();
};

backButton.addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex -= 1;
    const url = history[historyIndex];
    iframe.src = url;
    urlInput.value = url;
    updateNavButtons();
  }
});

forwardButton.addEventListener('click', () => {
  if (historyIndex !== -1 && historyIndex < history.length - 1) {
    historyIndex += 1;
    const url = history[historyIndex];
    iframe.src = url;
    urlInput.value = url;
    updateNavButtons();
  }
});

reloadButton.addEventListener('click', () => {
  if (historyIndex !== -1) {
    const url = history[historyIndex];
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
navigate(INITIAL_URL);
