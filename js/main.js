import { initRouter } from './router/router.js';
import { initAuth, hasClientId } from './services/googleAuth.js';
import { syncAll, demoSeed } from './services/syncService.js';
import { setState } from './state.js';
async function main() { initRouter(document.getElementById('app')); demoSeed(); window.addEventListener('viaticum:auth', () => syncAll()); await initAuth(); if (hasClientId()) setState({ error:'Sign in with Google from More to sync Sheets data.' }); }
main().catch(e => setState({ error:e.message || String(e) }));
window.viaticum = { syncAll };
