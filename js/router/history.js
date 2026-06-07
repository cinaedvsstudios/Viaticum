import { setState, state } from '../state.js';
export function pushRoute(route) { if (state.route !== route) history.pushState({ route }, '', `#${route}`); setState({ route }); }
export function initHistory(render) { history.replaceState({ route:state.route }, '', location.hash || '#main'); window.addEventListener('popstate', e => { setState({ modal:null, route:e.state?.route || 'main' }); render(); }); }
export function goMain() { history.pushState({ route:'main' }, '', '#main'); setState({ route:'main', modal:null }); }
