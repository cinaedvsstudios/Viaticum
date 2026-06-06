export const qs = (sel, root=document) => root.querySelector(sel);
export const clear = el => { if (el) el.textContent = ''; return el; };
export function el(tag, attrs={}, ...children) { const node=document.createElement(tag); Object.entries(attrs||{}).forEach(([k,v]) => { if (v==null || v===false) return; if (k==='class') node.className=v; else if (k==='dataset') Object.assign(node.dataset,v); else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v); else if (k==='html') node.innerHTML=v; else node.setAttribute(k, v===true ? '' : v); }); children.flat().forEach(c => node.append(c?.nodeType ? c : document.createTextNode(c ?? ''))); return node; }
export const button = (label, onClick, className='btn') => el('button', { class:className, type:'button', onClick }, label);
export const openUrl = url => { if (url?.startsWith('http')) window.open(url, '_blank', 'noopener'); };
