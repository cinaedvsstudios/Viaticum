import { state, setState, entryByDate } from '../state.js';
import { el } from '../utils/dom.js';
import { addDays, formatLong } from '../utils/dates.js';
import { bottomNav } from '../components/bottomNav.js';
import { statusChips } from '../components/statusChips.js';
import { scheduleTimeline } from '../components/scheduleTimeline.js';
import { detailsGrid } from '../components/detailsGrid.js';
import { linksGrid } from '../components/linksGrid.js';
import { sectionCard } from '../components/sectionCard.js';
import { imageBox, findEventImage } from '../components/imageBox.js';
import { iconButton } from '../components/iconButton.js';
import { pushRoute, goMain } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll, clearDay } from '../services/syncService.js';
import { shareText } from '../utils/share.js';
import { shareDayText } from '../features/dayFeature.js';
import { attachHorizontalSwipe } from '../features/navigationFeature.js';

export function renderDayScreen() {
  const entry = entryByDate(state.selectedDate) || {
    date: state.selectedDate,
    location: '',
    event: '',
    status: '',
    schedule: '',
    details: '',
    links: ''
  };

  const root = el('main', { class: 'screen day-screen' },
    el('section', { class: 'day-shell' },
      header(entry),
      toolbar(entry),
      el('section', { class: 'day-content day-content-two-col' },
        entry.schedule ? sectionCard('SCHEDULE', scheduleTimeline(entry.schedule, state.refData), 'section-card schedule') : '',
        entry.details ? sectionCard('DETAILS', detailsGrid(entry.details, state.refData), 'section-card details') : '',
        entry.links ? sectionCard('DAY FILES', linksGrid(entry.links, state.refData), 'section-card files') : ''
      )
    ),
    bottomNav(state.refData, {
      homeLabel: 'Home',
      day: goMain,
      trip: () => pushRoute('trip'),
      sheet: () => window.open(sheetUrl(), '_blank', 'noopener'),
      sync: syncAll,
      more: () => setState({ modal: 'more' })
    }, 'day')
  );

  attachHorizontalSwipe(
    root,
    () => setState({ selectedDate: addDays(state.selectedDate, 1) }),
    () => setState({ selectedDate: addDays(state.selectedDate, -1) })
  );

  return root;
}

function header(entry) {
  return el('header', { class: 'day-header' },
    el('div', { class: 'day-header-text' },
      el('label', { class: 'day-date-control' },
        el('span', { class: 'day-date-display' }, formatLong(entry.date)),
        el('input', {
          class: 'day-date-native',
          type: 'date',
          value: entry.date,
          onChange: e => setState({ selectedDate: e.target.value }),
          ariaLabel: 'Change date'
        })
      ),
      entry.location ? el('h2', {}, `${state.refData.locations[entry.location] || '📍'} ${entry.location}`) : '',
      entry.event ? el('div', { class: 'day-event-status-line' },
        statusChips(entry.status, state.refData),
        el('span', { class: 'day-event-line' }, entry.event)
      ) : statusChips(entry.status, state.refData)
    ),
    imageBox(findEventImage(entry, state.refData), entry.event)
  );
}

function toolbar(entry) {
  return el('section', { class: 'toolbar day-toolbar' },
    el('div', { class: 'toolbar-left' },
      iconButton(state.refData, 'Btn_Nav_Day', 'Calendar', () => goMain()),
      iconButton(state.refData, 'Icon_Info', 'Info', () => {}),
      iconButton(state.refData, 'Icon_Map', 'Maps', () => {}),
      iconButton(state.refData, 'Btn_Nav_Sheet', 'Links', () => {})
    ),
    el('div', { class: 'toolbar-right' },
      iconButton(state.refData, 'Icon_Share_Day', 'Share', () => shareText('Viaticum day', shareDayText(entry))),
      iconButton(state.refData, 'Icon_Clear_Day', 'Clear', () => confirm('Clear this day?') && clearDay(entry)),
      iconButton(state.refData, 'Icon_Edit_Day', 'Edit', () => pushRoute('edit')),
      iconButton(state.refData, 'Icon_ExpandAll', 'Open', () => {})
    )
  );
}
