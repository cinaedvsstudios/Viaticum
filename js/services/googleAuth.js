import { config } from '../config.js';
import { setState, state } from '../state.js';

const CONNECTED_KEY = 'viaticum.googleConnected';
const TOKEN_KEY = 'viaticum.googleAccessToken';
const TOKEN_EXPIRY_KEY = 'viaticum.googleAccessTokenExpiresAt';
const LAST_AUTH_ERROR_KEY = 'viaticum.googleLastAuthError';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const missing = () => !config.googleClientId || config.googleClientId.includes('PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE');

let tokenClient = null;
let restoreAttemptInProgress = false;
let interactiveSignInInProgress = false;
let pendingTokenRequest = null;
let pendingTokenResolve = null;
let pendingTokenReject = null;

export function hasClientId() {
  return !missing();
}

export function storageAvailable() {
  try {
    const key = 'viaticum.storageTest';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    sessionStorage.setItem(key, '1');
    sessionStorage.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

function readStorage(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
  } catch (_) {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {}

  try {
    sessionStorage.setItem(key, value);
  } catch (_) {}
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}

  try {
    sessionStorage.removeItem(key);
  } catch (_) {}
}

function nowMs() {
  return Date.now();
}

function tokenExpiryMs() {
  const raw = readStorage(TOKEN_EXPIRY_KEY);
  const value = Number(raw || 0);
  return Number.isFinite(value) ? value : 0;
}

function tokenExpiresSoon() {
  return tokenExpiryMs() <= nowMs() + TOKEN_REFRESH_BUFFER_MS;
}

function cachedToken({ allowNearExpiry = false } = {}) {
  const token = readStorage(TOKEN_KEY);
  const expiresAt = tokenExpiryMs();

  if (token && expiresAt && expiresAt > nowMs() + (allowNearExpiry ? 0 : TOKEN_REFRESH_BUFFER_MS)) {
    return token;
  }

  if (token && expiresAt && expiresAt <= nowMs()) {
    clearCachedTokenOnly();
  }

  return '';
}

function cacheToken(token, expiresInSeconds) {
  const safeExpiresIn = Number(expiresInSeconds || 3600);
  const expiresAt = nowMs() + Math.max(60, safeExpiresIn - 60) * 1000;

  writeStorage(TOKEN_KEY, token);
  writeStorage(TOKEN_EXPIRY_KEY, String(expiresAt));
}

export function clearCachedTokenOnly() {
  removeStorage(TOKEN_KEY);
  removeStorage(TOKEN_EXPIRY_KEY);
  setState({ accessToken: '' });
}

function setConnected(value) {
  if (value) {
    writeStorage(CONNECTED_KEY, 'true');
  } else {
    removeStorage(CONNECTED_KEY);
  }
}

export function isGoogleConnected() {
  return readStorage(CONNECTED_KEY) === 'true';
}

export function lastAuthError() {
  return readStorage(LAST_AUTH_ERROR_KEY);
}

function setLastAuthError(value) {
  if (value) writeStorage(LAST_AUTH_ERROR_KEY, value);
  else removeStorage(LAST_AUTH_ERROR_KEY);
}

export function accessToken() {
  const token = state.accessToken || cachedToken({ allowNearExpiry: true });

  if (token && !tokenExpiresSoon()) {
    return token;
  }

  if (token && tokenExpiryMs() > nowMs()) {
    return token;
  }

  return '';
}

export function accessTokenActive() {
  return Boolean(accessToken());
}

export function authDebugInfo() {
  return {
    hasClientId: hasClientId(),
    googleConnected: isGoogleConnected(),
    accessTokenActive: accessTokenActive(),
    storageAvailable: storageAvailable(),
    tokenExpiresAt: tokenExpiryMs(),
    lastAuthError: lastAuthError()
  };
}

async function waitForGoogleIdentity() {
  await new Promise(resolve => {
    const wait = () => window.google?.accounts?.oauth2 ? resolve() : setTimeout(wait, 50);
    wait();
  });
}

async function ensureTokenClient() {
  if (tokenClient) return true;

  if (missing()) {
    setState({
      authReady: false,
      demoMode: true,
      error: 'Google OAuth client ID is missing. Add it in js/config.js to sync.'
    });
    return false;
  }

  await waitForGoogleIdentity();

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.googleClientId,
    scope: config.scopes,
    callback: handleTokenResponse
  });

  setState({ authReady: true });
  return true;
}

export async function initAuth() {
  if (missing()) {
    setState({
      authReady: false,
      demoMode: true,
      error: 'Google OAuth client ID is missing. Add it in js/config.js to sync.'
    });
    return false;
  }

  const token = cachedToken();

  if (token) {
    setState({
      accessToken: token,
      authReady: true,
      demoMode: false,
      error: ''
    });

    setTimeout(() => window.dispatchEvent(new CustomEvent('viaticum:auth')), 50);
  }

  const ok = await ensureTokenClient();
  if (!ok) return false;

  if (token) {
    return true;
  }

  if (isGoogleConnected()) {
    restoreAttemptInProgress = true;
    setState({
      authReady: true,
      demoMode: true,
      error: 'Restoring Google connection…'
    });

    setTimeout(() => requestSilentToken().catch(() => {}), 100);
    return true;
  }

  setState({
    authReady: true,
    demoMode: true,
    error: 'Sign in with Google from Settings to sync Sheets data.'
  });

  return true;
}

function beginPendingRequest() {
  if (pendingTokenRequest) return pendingTokenRequest;

  pendingTokenRequest = new Promise((resolve, reject) => {
    pendingTokenResolve = resolve;
    pendingTokenReject = reject;
  }).finally(() => {
    pendingTokenRequest = null;
    pendingTokenResolve = null;
    pendingTokenReject = null;
  });

  return pendingTokenRequest;
}

async function requestToken(promptValue = '') {
  const ok = await ensureTokenClient();
  if (!ok) throw new Error('Google OAuth is not configured.');

  const request = beginPendingRequest();

  try {
    tokenClient.requestAccessToken({ prompt: promptValue });
  } catch (error) {
    restoreAttemptInProgress = false;
    interactiveSignInInProgress = false;

    const message = error?.message || 'Google token request failed.';
    setLastAuthError(message);
    clearCachedTokenOnly();

    if (pendingTokenReject) pendingTokenReject(error);

    setState({
      accessToken: '',
      demoMode: true,
      error: 'Reconnect Google from Settings to sync Sheets data.'
    });
  }

  return request;
}

function requestSilentToken() {
  restoreAttemptInProgress = true;
  return requestToken('');
}

function handleTokenResponse(res) {
  if (res?.access_token) {
    restoreAttemptInProgress = false;
    interactiveSignInInProgress = false;

    setConnected(true);
    setLastAuthError('');
    cacheToken(res.access_token, res.expires_in);

    setState({
      accessToken: res.access_token,
      authReady: true,
      demoMode: false,
      error: ''
    });

    if (pendingTokenResolve) pendingTokenResolve(res.access_token);

    window.dispatchEvent(new CustomEvent('viaticum:auth'));
    return;
  }

  const message = res?.error_description || res?.error || 'Google sign-in did not return an access token.';
  setLastAuthError(message);
  clearCachedTokenOnly();

  if (pendingTokenReject) pendingTokenReject(new Error(message));

  if (restoreAttemptInProgress) {
    restoreAttemptInProgress = false;

    setState({
      accessToken: '',
      authReady: true,
      demoMode: true,
      error: 'Reconnect Google from Settings to sync Sheets data.'
    });

    return;
  }

  interactiveSignInInProgress = false;

  setState({
    accessToken: '',
    authReady: true,
    demoMode: true,
    error: message
  });
}

export async function getValidAccessToken() {
  const token = cachedToken();

  if (token) {
    if (state.accessToken !== token) setState({ accessToken: token });
    return token;
  }

  if (!isGoogleConnected()) {
    throw new Error('Not signed in to Google.');
  }

  return requestSilentToken();
}

export async function refreshAccessToken({ interactive = false } = {}) {
  const promptValue = interactive || !isGoogleConnected() ? 'consent' : '';
  return requestToken(promptValue);
}

export async function signIn() {
  const ok = await ensureTokenClient();
  if (!ok) return;

  interactiveSignInInProgress = true;
  restoreAttemptInProgress = false;

  try {
    await requestToken(isGoogleConnected() ? '' : 'consent');
  } catch (error) {
    interactiveSignInInProgress = false;
    const message = error?.message || 'Google sign-in failed.';
    setLastAuthError(message);

    setState({
      accessToken: '',
      demoMode: true,
      error: message
    });
  }
}

export async function reconnectGoogle() {
  const ok = await ensureTokenClient();
  if (!ok) return;

  restoreAttemptInProgress = true;

  try {
    await requestToken('');
  } catch (_) {
    restoreAttemptInProgress = false;
    await signIn();
  }
}

export function signOut() {
  const token = state.accessToken || cachedToken({ allowNearExpiry: true });

  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token);
    } catch (_) {}
  }

  setConnected(false);
  clearCachedTokenOnly();
  setLastAuthError('');

  setState({
    accessToken: '',
    authReady: true,
    demoMode: true,
    error: 'Signed out of Google.'
  });
}
