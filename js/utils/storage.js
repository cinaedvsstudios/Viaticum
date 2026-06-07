const store = () => globalThis.localStorage;
export const getItem = (k, fallback='') => store()?.getItem(k) ?? fallback;
export const setItem = (k, v) => store()?.setItem(k, String(v));
export const getBool = (k, fallback=false) => { const v=store()?.getItem(k); return v == null ? fallback : v === 'true'; };
export const setBool = (k, v) => store()?.setItem(k, v ? 'true' : 'false');
