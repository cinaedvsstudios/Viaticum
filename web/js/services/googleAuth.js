import { config } from '../config.js';
import { setState, state } from '../state.js';
const missing = () => !config.googleClientId || config.googleClientId.includes('PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE');
let tokenClient;
export function hasClientId() { return !missing(); }
export function accessToken() { return state.accessToken; }
export async function initAuth() {
  if (missing()) { setState({ authReady:false, demoMode:true, error:'Google OAuth client ID is missing. Add it in web/js/config.js to sync.' }); return false; }
  await new Promise(resolve => { const wait=()=>window.google?.accounts?.oauth2 ? resolve() : setTimeout(wait, 50); wait(); });
  tokenClient = window.google.accounts.oauth2.initTokenClient({ client_id: config.googleClientId, scope: config.scopes, callback: handleTokenResponse });
  setState({ authReady:true }); return true;
}
function handleTokenResponse(res) {
  if (res.access_token) { setState({ accessToken:res.access_token, authReady:true, demoMode:false, error:'' }); window.dispatchEvent(new CustomEvent('viaticum:auth')); return; }
  setState({ error:res.error || 'Google sign-in failed' });
}
export function signIn() { if (!tokenClient) return initAuth().then(ok => ok && tokenClient.requestAccessToken()); tokenClient.requestAccessToken({ prompt: state.accessToken ? '' : 'consent' }); }
export function signOut() { if (state.accessToken && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(state.accessToken); setState({ accessToken:'', demoMode:true }); }
