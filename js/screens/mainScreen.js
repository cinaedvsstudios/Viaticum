import { state, setState, entryByDate } from '../state.js';
import { el, button } from '../utils/dom.js';
import { formatLong, formatMonth, todayIso } from '../utils/dates.js';
import { getCalendarDays, monthEntries, monthOptions } from '../features/calendarFeature.js';
import { statusChips, statusEmojis } from '../components/statusChips.js';
import { scheduleTimeline } from '../components/scheduleTimeline.js';
import { detailsGrid } from '../components/detailsGrid.js';
import { linksGrid } from '../components/linksGrid.js';
import { sectionCard } from '../components/sectionCard.js';
import { bottomNav } from '../components/bottomNav.js';
import { loadingBanner } from '../components/loadingBanner.js';
import { iconButton } from '../components/iconButton.js';
import { pushRoute } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll, clearDay } from '../services/syncService.js';
import { shareText } from '../utils/share.js';
import { shareDayText } from '../features/dayFeature.js';
import { attachHorizontalSwipe } from '../features/navigationFeature.js';

export function renderMainScreen() {
  const selected = entryByDate(state.selectedDate) || {
    date: state.selectedDate,
    location: '',
    event: '',
    status: '',
    schedule: '',
    details: '',
    links: ''
  };

  const root = el('main', { class: 'screen main-screen' },
    loadingBanner(state),
    el('div', { class: 'main-desktop-grid' },
      el('section', { class: 'main-left-pane' }, header(), calendar(), scheduleList()),
      el('section', { class: 'main-right-pane' }, preview(selected))
    ),
    state.modal === 'month-picker' ? monthPickerModal() : '',
    nav()
  );

  attachHorizontalSwipe(
    root,
    () => setState({ currentMonthOffset: state.currentMonthOffset + 1 }),
    () => setState({ currentMonthOffset: state.currentMonthOffset - 1 })
  );

  return root;
}

function header() {
  return el('section', { class: 'month-header compact-month-header' },
    el('button', { type: 'button', class: 'month-arrow', onClick: () => setState({ currentMonthOffset: state.currentMonthOffset - 1 }) }, '‹'),
    el('button', { type: 'button', class: 'month-picker-button', onClick: () => setState({ modal: 'month-picker' }) },
      formatMonth(todayIso(), state.currentMonthOffset),
      el('span', { class: 'month-picker-caret' }, '▾')
    ),
    el('button', { type: 'button', class: 'month-arrow', onClick: () => setState({ currentMonthOffset: state.currentMonthOffset + 1 }) }, '›')
  );
}

function monthPickerModal() {
  const options = monthOptions();
  return el('div', {
      class: 'modal-backdrop month-modal-backdrop',
      onClick: e => {
        if (e.target.classList.contains('month-modal-backdrop')) setState({ modal: null });
      }
    },
    el('section', { class: 'month-modal' },
      el('header', {},
        el('strong', {}, 'Choose month'),
        button('✕', () => setState({ modal: null }), 'mini month-close')
      ),
      el('div', { class: 'month-modal-grid' },
        options.map(o => button(
          o.label ?? o,
          () => setState({ currentMonthOffset: Number(o.value ?? o), modal: null }),
          Number(o.value ?? o) === state.currentMonthOffset ? 'month-option active' : 'month-option'
        ))
      )
    )
  );
}

function calendar() {
  const days = getCalendarDays(state);
  return el('section', { class: 'calendar-card' },
    el('div', { class: 'weekdays' }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => el('b', {}, d))),
    el('div', { class: 'calendar-grid' }, days.map(dayCell))
  );
}

function dayCell(day) {
  const entry = entryByDate(day.iso);
  const hasData = entry && [entry.location, entry.event, entry.status, entry.schedule, entry.details, entry.links].some(Boolean);
  const emojis = statusEmojis(entry?.status || '', state.refData);
  const classes = [
    'day-cell',
    !day.inMonth ? 'filler' : '',
    day.iso === state.selectedDate ? 'selected' : '',
    day.isToday ? 'today' : '',
    day.isPast && !day.isToday ? 'past' : '',
    !hasData && day.inMonth ? 'empty' : ''
  ].filter(Boolean).join(' ');

  return el('button', { class: classes, type: 'button', onClick: () => setState({ selectedDate: day.iso }) },
    emojis.length ? el('span', { class: 'emoji-grid' }, emojis.map(e => el('span', {}, e))) : String(day.day)
  );
}

function scheduleList() {
  const entries = monthEntries(state);
  return el('section', { class: 'schedule-list' },
    el('h2', {}, 'Schedule'),
    el('div', { class: 'schedule-table' },
      el('div', { class: 'schedule-head' }, el('span', {}, 'Date'), el('span', {}, 'Location'), el('span', {}, 'Event')),
      entries.map(e => el('button', { class: e.date === state.selectedDate ? 'schedule-row selected' : 'schedule-row', type: 'button', onClick: () => setState({ selectedDate: e.date }) },
        el('span', {}, `${e.date.slice(8)} ${statusEmojis(e.status || '', state.refData)[0] || ''}`.trim()),
        el('span', {}, `${state.refData.locations[e.location] || ''} ${e.location}`.trim()),
        el('span', {}, e.event.split(',').map(evt => `${state.refData.events[evt.trim()] || ''} ${evt.trim()}`.trim()).join(' • '))
      ))
    )
  );
}

function preview(entry) {
  const hasContent = entry.location || entry.event || entry.status || entry.schedule || entry.details || entry.links;
  return el('section', { class: 'preview-panel' },
    el('header', { class: 'preview-click-header', onClick: () => pushRoute('day') },
      el('div', {},
        el('h2', {}, formatLong(entry.date)),
        entry.location || entry.event ? el('p', {}, `${entry.location}${entry.location && entry.event ? ' • ' : ''}${entry.event}`.trim()) : el('p', {}, 'Select a day')
      ),
      statusChips(entry.status, state.refData)
    ),
    el('div', { class: 'toolbar preview-toolbar' },
      el('div', { class: 'toolbar-left' },
        iconButton(state.refData, 'Btn_Nav_Day', 'Calendar', () => pushRoute('day')),
        iconButton(state.refData, 'Icon_Info', 'Info', () => {}),
        iconButton(state.refData, 'Icon_Map', 'Maps', () => {}),
        iconButton(state.refData, 'Btn_Nav_Sheet', 'Links', () => {})
      ),
      el('div', { class: 'toolbar-right' },
        iconButton(state.refData, 'Icon_Share_Day', 'Share', () => shareText('Viaticum day', shareDayText(entry))),
        iconButton(state.refData, 'Icon_Clear_Day', 'Clear', () => hasContent && confirm('Clear this day?') && clearDay(entry)),
        iconButton(state.refData, 'Icon_Edit_Day', 'Edit', () => pushRoute('edit')),
        iconButton(state.refData, 'Icon_ExpandAll', 'Open', () => pushRoute('day'))
      )
    ),
    el('div', { class: 'preview-scroll' },
      entry.schedule ? sectionCard('SCHEDULE', scheduleTimeline(entry.schedule, state.refData), 'section-card schedule') : '',
      entry.details ? sectionCard('DETAILS', detailsGrid(entry.details, state.refData), 'section-card details') : '',
      entry.links ? sectionCard('DAY FILES', linksGrid(entry.links, state.refData), 'section-card files') : '',
      !entry.schedule && !entry.details && !entry.links ? el('p', { class: 'muted no-details' }, 'No details for selected day.') : ''
    )
  );
}

function nav() {
  return bottomNav(state.refData, {
    day: () => pushRoute('day'),
    trip: () => pushRoute('trip'),
    sheet: () => window.open(sheetUrl(), '_blank', 'noopener'),
    sync: syncAll,
    more: () => setState({ modal: 'more' })
  }, 'day');
}
