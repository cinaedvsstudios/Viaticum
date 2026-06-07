import { el } from '../utils/dom.js';

function emojiFor(text, schedules) {
  let out = '';

  Object.entries(schedules || {}).forEach(([key, emoji]) => {
    if (text.toLowerCase().includes(key.toLowerCase())) out = emoji;
  });

  return out;
}

function parseScheduleLine(line) {
  const text = String(line || '').trim();

  const colonMatch = text.match(/^([0-2]?\d[:hH][0-5]\d)\s*:?\s*(.*)$/);
  if (colonMatch) {
    return {
      time: colonMatch[1].replace(':', 'h'),
      activity: colonMatch[2].trim()
    };
  }

  const labelMatch = text.match(/^(Arrive|Depart|Day|Event)\s*:?\s*(.*)$/i);
  if (labelMatch) {
    return {
      time: labelMatch[1],
      activity: labelMatch[2].trim()
    };
  }

  return { time: '', activity: text };
}

export function scheduleTimeline(schedule = '', refData = {}) {
  const lines = schedule.split('\n').map(x => x.trim()).filter(Boolean);

  if (!lines.length) {
    return el('p', { class: 'muted' }, 'No schedule.');
  }

  return el('div', { class: 'timeline' },
    lines.map(line => {
      const parsed = parseScheduleLine(line);

      return el('div', { class: 'timeline-row' },
        el('time', {}, parsed.time),
        el('span', { class: 'dot' }),
        el('p', {}, parsed.activity),
        el('b', {}, emojiFor(parsed.activity, refData.schedules))
      );
    })
  );
}
