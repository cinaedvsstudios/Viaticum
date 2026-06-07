import { el } from '../utils/dom.js';

const clean = value => String(value || '').trim();
const icon = (refData, key, fallback) => refData?.buttons?.[key] || fallback;
const splitItems = value => clean(value).split('|').map(clean).filter(Boolean);

function parseDetails(detailsText) {
  const sections = { info: [], paid: [], unpaid: [], maps: [], codes: [] };
  let active = 'info';

  clean(detailsText).split('\n').map(line => line.trim()).filter(Boolean).forEach(line => {
    const match = line.match(/^(Info|Paid|Unpaid|Maps|Codes?)\s*:\s*(.*)$/i);

    if (match) {
      const label = match[1].toLowerCase();
      const value = clean(match[2]);
      active = label === 'code' || label === 'codes' ? 'codes' : label;

      if (value) {
        if (active === 'info') sections.info.push(value);
        else sections[active].push(...splitItems(value));
      }
      return;
    }

    if (active === 'info') sections.info.push(line);
    else sections[active].push(...splitItems(line));
  });

  return sections;
}

function nameAndMeta(raw) {
  const text = clean(raw);
  if (text.includes(' - ')) {
    const [name, ...rest] = text.split(' - ');
    return { name: clean(name), meta: clean(rest.join(' - ')) };
  }
  if (text.includes(',')) {
    const [name, ...rest] = text.split(',');
    return { name: clean(name), meta: clean(rest.join(',')) };
  }
  return { name: text, meta: '' };
}

function nameAndUrl(raw) {
  const text = clean(raw);
  if (text.includes(' - ')) {
    const [name, ...rest] = text.split(' - ');
    return { name: clean(name), url: clean(rest.join(' - ')) };
  }
  if (text.includes(',')) {
    const [name, ...rest] = text.split(',');
    return { name: clean(name), url: clean(rest.join(',')) };
  }
  return { name: text, url: '' };
}

function infoBlock(lines, refData) {
  if (!lines.length) return '';
  const infoIcon = icon(refData, 'Icon_Info', 'ℹ️');

  return el('section', { class: 'vtm-detail-section vtm-info-section' },
    el('div', { class: 'vtm-info-lines' },
      lines.map(line => el('p', { class: 'vtm-info-line' }, `${infoIcon} ${line}`))
    )
  );
}

function pillSection(title, items, kind, refData) {
  if (!items.length) return '';

  const pillIcon = kind === 'paid'
    ? icon(refData, 'Icon_Paid', '✅')
    : icon(refData, 'Icon_Unpaid', '⚠️');

  return el('section', { class: `vtm-detail-section vtm-${kind}-section` },
    el('h4', { class: 'vtm-detail-heading' }, title),
    el('div', { class: `vtm-pill-list vtm-${kind}-pill-list` },
      items.map(raw => {
        const item = nameAndMeta(raw);
        return el('span', { class: `vtm-detail-pill vtm-${kind}-pill` },
          el('span', { class: 'vtm-pill-icon' }, pillIcon),
          el('span', { class: 'vtm-pill-text' }, item.meta ? `${item.name}, ${item.meta}` : item.name)
        );
      })
    )
  );
}

function mapsSection(items, refData) {
  if (!items.length) return '';
  const mapIcon = icon(refData, 'Icon_Map', '🗺️');

  return el('section', { class: 'vtm-detail-section vtm-maps-section' },
    el('h4', { class: 'vtm-detail-heading' }, 'MAPS'),
    el('div', { class: 'vtm-map-list' },
      items.map(raw => {
        const item = nameAndUrl(raw);
        const card = el('div', { class: 'vtm-map-card' },
          el('span', { class: 'vtm-map-icon' }, mapIcon),
          el('span', { class: 'vtm-map-title' }, item.name || 'Map')
        );

        if (item.url && item.url.startsWith('http')) {
          return el('button', {
            type: 'button',
            class: 'vtm-map-card-button',
            onClick: () => window.open(item.url, '_blank', 'noopener')
          }, card);
        }

        return card;
      })
    )
  );
}

function codesSection(items) {
  if (!items.length) return '';
  return el('section', { class: 'vtm-detail-section vtm-codes-section' },
    el('h4', { class: 'vtm-detail-heading' }, 'CODES'),
    el('div', { class: 'vtm-code-list' },
      items.map(raw => el('span', { class: 'vtm-code-pill' }, raw))
    )
  );
}

const divider = () => el('hr', { class: 'vtm-detail-divider' });

export function detailsGrid(detailsText, refData = {}) {
  const sections = parseDetails(detailsText);
  const blocks = [];

  const info = infoBlock(sections.info, refData);
  if (info) blocks.push(info);

  const paid = pillSection('PAID', sections.paid, 'paid', refData);
  if (paid) {
    if (blocks.length) blocks.push(divider());
    blocks.push(paid);
  }

  const unpaid = pillSection('UNPAID', sections.unpaid, 'unpaid', refData);
  if (unpaid) {
    if (blocks.length) blocks.push(divider());
    blocks.push(unpaid);
  }

  const maps = mapsSection(sections.maps, refData);
  if (maps) {
    if (blocks.length) blocks.push(divider());
    blocks.push(maps);
  }

  const codes = codesSection(sections.codes);
  if (codes) {
    if (blocks.length) blocks.push(divider());
    blocks.push(codes);
  }

  return el('div', { class: 'vtm-details-stack' }, blocks);
}
