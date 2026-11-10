import { config } from '../config.js';
import { getValidAccessToken, clearCachedTokenOnly } from './googleAuth.js';

async function headers() {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not signed in to Google.');

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

const base = range => `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`;

export async function authedFetch(url, options = {}, retry = true) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(await headers()),
      ...(options.headers || {})
    }
  });

  if ((res.status === 401 || res.status === 403) && retry) {
    clearCachedTokenOnly();

    const retryRes = await fetch(url, {
      ...options,
      headers: {
        ...(await headers()),
        ...(options.headers || {})
      }
    });

    return retryRes;
  }

  return res;
}

export async function spreadsheetBatch(requests) {
  const res = await authedFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
    method: 'POST', body: JSON.stringify({ requests })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function spreadsheetProperties() {
  const res = await authedFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets.properties`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).sheets.map(sheet => sheet.properties);
}

export async function fetchRange(range) {
  const res = await authedFetch(base(range));

  if (!res.ok) throw new Error(await res.text());

  return (await res.json()).values || [];
}

export async function updateRange(range, values) {
  const url = `${base(range)}?valueInputOption=USER_ENTERED`;
  const res = await authedFetch(url, {
    method: 'PUT',
    body: JSON.stringify({ values })
  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();
}
