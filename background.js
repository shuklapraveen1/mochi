// background.js — shared Mochi state + the toolbar-icon right-click entry.
// State (both flags live in chrome.storage.session: memory only, cleared when the browser closes):
//   hidden  = whole scene hidden, characters too   (popup "Mochi" switch / right-click "Hide Mochi")
//   enabled = emotions, actions and Enter reactions on  (popup switch / the toggle in the hover menu)
// Left-click on the icon opens popup.html; right-click shows the "Hide Mochi" checkbox.
const MENU_ID = 'mochi-hide';

function createMenu(hidden) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: 'Hide Mochi', type: 'checkbox', checked: !!hidden, contexts: ['action'] });
  });
}

async function getState() {
  const r = await chrome.storage.session.get(['hidden', 'enabled']);
  return { hidden: !!r.hidden, enabled: r.enabled !== false };
}

// Merge a patch, store it, update menu/badge, and tell every tab.
async function setState(patch) {
  const state = { ...(await getState()), ...patch };
  state.hidden = !!state.hidden;
  state.enabled = state.enabled !== false;
  await chrome.storage.session.set(state);
  chrome.contextMenus.update(MENU_ID, { checked: state.hidden }, () => void chrome.runtime.lastError);
  chrome.action.setBadgeText({ text: state.hidden ? 'hid' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#3a40a0' });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((t) => {
      if (t.id != null) chrome.tabs.sendMessage(t.id, { type: 'mochi-state', ...state }, () => void chrome.runtime.lastError);
    });
  });
  return state;
}

chrome.runtime.onInstalled.addListener(async () => createMenu((await getState()).hidden));
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.session.set({ hidden: false, enabled: true });
  chrome.action.setBadgeText({ text: '' });
  createMenu(false);
});

function handleMenuClick(info) {
  if (info.menuItemId === MENU_ID) setState({ hidden: !!info.checked });
}
chrome.contextMenus.onClicked.addListener(handleMenuClick);

// Messages from the popup and from pages.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'mochi-get-state') {
    getState().then(sendResponse);
    return true; // async response
  }
  if (msg.type === 'mochi-set') {
    const patch = {};
    if ('hidden' in msg) patch.hidden = msg.hidden;
    if ('enabled' in msg) patch.enabled = msg.enabled;
    setState(patch).then(sendResponse);
    return true;
  }
});
