const ACTION_LABELS = ['Preview', 'Save', 'Copy', 'Move', 'Clear', 'Cancel'];

function textOf(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isEditScreen() {
  return Boolean(
    document.querySelector('.edit-screen') ||
    [...document.querySelectorAll('h1,h2')].some(el => textOf(el).toLowerCase() === 'edit day')
  );
}

function editScreenRoot() {
  return document.querySelector('.edit-screen') ||
    [...document.querySelectorAll('main,section,div')]
      .find(el => textOf(el).includes('Edit Day') && textOf(el).includes('Location')) ||
    document.querySelector('#app') ||
    document.body;
}

function editTitle() {
  return [...document.querySelectorAll('h1,h2')]
    .find(el => textOf(el).toLowerCase() === 'edit day') || null;
}

function findEditHeaderCard() {
  const title = editTitle();
  const root = editScreenRoot();
  if (!title || !root) return null;

  let node = title;
  let best = title;

  while (node && node !== root && node !== document.body) {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    const radius = parseFloat(style.borderTopLeftRadius || '0');
    const bg = style.backgroundColor || '';
    const isBlueish = bg.includes('33, 150, 243') || bg.includes('41, 169') || bg.includes('76, 195') || bg.includes('rgb(33');
    const looksLikeHeaderCard = rect.width >= 280 && rect.height >= 70 && (radius >= 10 || isBlueish);
    if (looksLikeHeaderCard) best = node;
    node = node.parentElement;
  }

  return best;
}

function findEditActionButtons() {
  const buttons = [...document.querySelectorAll('button')];
  return ACTION_LABELS
    .map(label => buttons.find(button => textOf(button).includes(label)))
    .filter(Boolean);
}

function sharedParent(buttons) {
  if (!buttons.length) return null;
  const directParent = buttons[0].parentElement;
  if (directParent && buttons.every(button => button.parentElement === directParent)) return directParent;
  let node = directParent;
  while (node && node !== document.body) {
    if (buttons.every(button => node.contains(button))) return node;
    node = node.parentElement;
  }
  return directParent;
}

function markDuplicates(button) {
  [...button.querySelectorAll('img, svg')].slice(1).forEach(node => {
    node.dataset.viaticumDuplicateIcon = 'true';
  });

  const seen = new Set();
  [...button.querySelectorAll('span')].forEach(span => {
    const text = textOf(span);
    if (!text) return;
    if (seen.has(text)) span.dataset.viaticumDuplicateIcon = 'true';
    seen.add(text);
  });
}

function placeEditActionsBelowHeader() {
  if (!isEditScreen()) return;
  const buttons = findEditActionButtons();
  if (buttons.length < 4) return;

  const bar = sharedParent(buttons);
  const headerCard = findEditHeaderCard();
  if (!bar || !headerCard || bar === headerCard || bar.contains(headerCard)) return;

  bar.classList.remove('vtm-edit-action-bar');
  bar.classList.remove('vtm-edit-action-bar-top');
  bar.classList.add('vtm-edit-action-bar-below-header');

  bar.style.position = 'static';
  bar.style.top = 'auto';
  bar.style.bottom = 'auto';
  bar.style.left = 'auto';
  bar.style.right = 'auto';
  bar.style.transform = 'none';

  buttons.forEach(button => {
    button.classList.add('vtm-edit-action-button');
    markDuplicates(button);
  });

  if (headerCard.nextElementSibling !== bar) {
    headerCard.insertAdjacentElement('afterend', bar);
  }
}

function markMonthPicker() {
  document.querySelector('.month-modal')?.classList.add('vtm-month-dropdown-modal');
  document.querySelector('.month-modal-backdrop')?.classList.add('vtm-month-dropdown-backdrop');
}

function runFixes() {
  placeEditActionsBelowHeader();
  markMonthPicker();
}

new MutationObserver(runFixes).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', runFixes);
window.addEventListener('hashchange', () => setTimeout(runFixes, 50));
setInterval(runFixes, 500);
runFixes();
