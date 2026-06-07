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
import { datePicker } from '../components/datePicker.js';
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
    el('header', { class: 'day-header' },
      el('div', {},
        datePicker(entry.date, d => setState({ selectedDate: d })),
        el('h1', {}, formatLong(entry.date)),
        entry.location ? el('h2', {}, `${state.refData.locations[entry.location] || '📍'} ${entry.location}`) : '',
        statusChips(entry.status, state.refData)
      ),
      imageBox(findEventImage(entry, state.refData), entry.event)
    ),
    el('section', { class: 'toolbar day-toolbar' },
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
    ),
    el('section', { class: 'day-content' },
      sectionCard('SCHEDULE', scheduleTimeline(entry.schedule, state.refData), 'section-card schedule'),
      sectionCard('DETAILS', detailsGrid(entry.details, state.refData), 'section-card details'),
      sectionCard('DAY FILES', linksGrid(entry.links, state.refData), 'section-card files')
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
