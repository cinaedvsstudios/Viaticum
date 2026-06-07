import { config } from '../config.js';
import { setState, state } from '../state.js';

const AUTH_WANTED_KEY = 'viaticum.googleAuthWanted';
const TOKEN_KEY = 'viaticum.googleAccessToken';
const TOKEN_EXPIRY_KEY = 'viaticum.googleAccessTokenExpiresAt';

const missing = () => !config.googleClientId || config.googleClientId.includes('PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE');

let tokenClient;
let silentRestoreInProgress = false;

export function hasClientId() {
  return !missing();
}

export function accessToken() {
  return state.accessToken || cachedToken();
}

function nowMs() {
  return Date.now();
}

function cachedToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
    const expiresAt = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || localStorage.getItem(TOKEN_EXPIRY_KEY) || 0);

    // Give ourselves a 2-minute safety buffer so we do not reuse a token that is about to expire.
    if (token && expiresAt && expiresAt > nowMs() + 120000) {
      return token;
    }

    clearCachedTokenOnly();
    return '';
  } catch (_) {
    return '';
  }
}

function cacheToken(token, expiresInSeconds) {
  const safeExpiresIn = Number(expiresInSeconds || 3600);
  const expiresAt = nowMs() + Math.max(60, safeExpiresIn - 60) * 1000;

  try {
    // sessionStorage keeps refreshes in the same browser tab working.
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));

    // localStorage keeps refreshes/new tabs working for this personal app.
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
  } catch (_) {}
}

function clearCachedTokenOnly() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (_) {}
}

function rememberGoogleSignIn() {
  try {
    localStorage.setItem(AUTH_WANTED_KEY, 'true');
  } catch (_) {}
}

function forgetGoogleSignIn() {
  try {
    localStorage.removeItem(AUTH_WANTED_KEY);
  } catch (_) {}
}

function shouldRestoreGoogleSignIn() {
  try {
    return localStorage.getItem(AUTH_WANTED_KEY) === 'true';
  } catch (_) {
    return false;
  }
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

    // Let sync run after the app has mounted.
    setTimeout(() => window.dispatchEvent(new CustomEvent('viaticum:auth')), 50);
  }

  await new Promise(resolve => {
    const wait = () => window.google?.accounts?.oauth2 ? resolve() : setTimeout(wait, 50);
    wait();
  });

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.googleClientId,
    scope: config.scopes,
    callback: handleTokenResponse
  });

  setState({ authReady: true });

  if (!token && shouldRestoreGoogleSignIn()) {
    silentRestoreInProgress = true;
    setState({ error: 'Restoring Google sign-in…' });

    setTimeout(() => {
      try {
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (_) {
        silentRestoreInProgress = false;
        setState({ error: 'Sign in with Google from Settings to sync Sheets data.' });
      }
    }, 150);
  } else if (!token) {
    setState({ error: 'Sign in with Google from Settings to sync Sheets data.' });
  }

  return true;
}

function handleTokenResponse(res) {
  if (res?.access_token) {
    silentRestoreInProgress = false;
    rememberGoogleSignIn();
    cacheToken(res.access_token, res.expires_in);

    setState({
      accessToken: res.access_token,
      authReady: true,
      demoMode: false,
      error: ''
    });

    window.dispatchEvent(new CustomEvent('viaticum:auth'));
    return;
  }

  const wasSilent = silentRestoreInProgress;
  silentRestoreInProgress = false;

  if (wasSilent) {
    clearCachedTokenOnly();
    setState({ error: 'Google session could not be restored silently. Sign in from Settings to sync Sheets data.' });
    return;
  }

  clearCachedTokenOnly();
  setState({ error: res?.error || 'Google sign-in failed' });
}

export async function signIn() {
  if (!tokenClient) {
    const ok = await initAuth();
    if (!ok) return;
  }

  tokenClient.requestAccessToken({ prompt: state.accessToken || cachedToken() ? '' : 'consent' });
}

export function signOut() {
  forgetGoogleSignIn();

  const token = state.accessToken || cachedToken();
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token);
  }

  clearCachedTokenOnly();

  setState({
    accessToken: '',
    demoMode: true,
    error: 'Signed out of Google.'
  });
}
