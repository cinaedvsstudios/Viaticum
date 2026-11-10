import { setState, state } from '../state.js';
export function pushRoute(route) { if (state.route !== route) history.pushState({ route }, '', `#${route}`); setState({ route }); }
export function initHistory(render) { history.replaceState({ route:state.route }, '', location.hash || '#main'); window.addEventListener('popstate', e => { if (state.modal === 'overview') { const event = new CustomEvent('viaticum:leave-overview', { cancelable:true }); window.dispatchEvent(event); if(event.defaultPrevented) { history.pushState({route:state.route}, '', `#${state.route}`); return; } } setState({ modal:null, route:e.state?.route || 'main' }); render(); }); }
export function goMain() { history.pushState({ route:'main' }, '', '#main'); setState({ route:'main', modal:null }); }
