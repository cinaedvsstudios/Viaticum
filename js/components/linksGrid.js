import { el, openUrl } from '../utils/dom.js';
import { parseNameUrlLine } from '../utils/sheetFieldParsers.js';

function emojiFor(name, schedules) {
  let icon = '📄';

  Object.entries(schedules || {}).forEach(([key, emoji]) => {
    if (name.toLowerCase().includes(key.toLowerCase())) icon = emoji;
  });

  return icon;
}

export function linksGrid(text = '', refData = {}) {
  const links = text
    .split('\n')
    .map(line => parseNameUrlLine(line))
    .filter(item => item.name || item.url);

  if (!links.length) {
    return el('p', { class: 'muted' }, 'No day files.');
  }

  return el('div', { class: 'card-grid links-grid' },
    links.map(item => el('button', {
      class: 'file-card',
      type: 'button',
      disabled: item.url ? null : true,
      onClick: () => item.url ? openUrl(item.url) : undefined
    },
      el('b', {}, emojiFor(item.name || item.url, refData.schedules)),
      el('span', {}, item.name || item.url)
    ))
  );
}
