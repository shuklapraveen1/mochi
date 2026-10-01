// popup.js — the box that opens when you click the toolbar icon.
const rowHidden = document.getElementById('rowHidden');   // switch ON = Mochi shown (hidden = false)
const rowEnabled = document.getElementById('rowEnabled'); // switch ON = emotions & actions on

function render(state) {
  rowHidden.setAttribute('aria-checked', String(!state.hidden));
  rowEnabled.setAttribute('aria-checked', String(state.enabled));
  rowEnabled.classList.toggle('dim', state.hidden);
}

function send(patch) {
  chrome.runtime.sendMessage({ type: 'mochi-set', ...patch }, (state) => {
    void chrome.runtime.lastError;
    if (state) render(state);
  });
}

rowHidden.addEventListener('click', () => send({ hidden: rowHidden.getAttribute('aria-checked') === 'true' }));
rowEnabled.addEventListener('click', () => send({ enabled: rowEnabled.getAttribute('aria-checked') !== 'true' }));

chrome.runtime.sendMessage({ type: 'mochi-get-state' }, (state) => {
  void chrome.runtime.lastError;
  render(state || { hidden: false, enabled: true });
});
