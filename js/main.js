import { initRouter } from './router/router.js';
import { initAuth } from './services/googleAuth.js';
import { syncAll, demoSeed } from './services/syncService.js';
import { setState } from './state.js';

async function main() {
  initRouter(document.getElementById('app'));
  demoSeed();

  window.addEventListener('viaticum:auth', () => syncAll());

  await initAuth();

  // Do not show a persistent top banner just because the user is not signed in.
  // Connection/sign-in problems are now handled with Settings state and reconnect toasts.
}

main().catch(e => setState({ error: e.message || String(e) }));

window.viaticum = { syncAll };
