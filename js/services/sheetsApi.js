import { config } from '../config.js';
import { accessToken } from './googleAuth.js';
function headers() { const token = accessToken(); if (!token) throw new Error('Not signed in to Google.'); return { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' }; }
const base = range => `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`;
export async function fetchRange(range) { const res = await fetch(base(range), { headers: headers() }); if (!res.ok) throw new Error(await res.text()); return (await res.json()).values || []; }
export async function updateRange(range, values) { const url = `${base(range)}?valueInputOption=USER_ENTERED`; const res = await fetch(url, { method:'PUT', headers: headers(), body: JSON.stringify({ values }) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
