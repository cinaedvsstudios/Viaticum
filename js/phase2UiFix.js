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

function closestUsefulParent(buttons) {
  if (!buttons.length) return null;
  const parents = [];
  let node = buttons[0].parentElement;

  while (node && node !== document.body) {
    parents.push(node);
    node = node.parentElement;
  }

  return parents.find(parent => buttons.every(button => parent.contains(button))) || buttons[0].parentElement;
}

function findEditActionButtons() {
  const buttons = [...document.querySelectorAll('button')];
  return ACTION_LABELS
    .map(label => buttons.find(button => textOf(button).includes(label)))
    .filter(Boolean);
}

function dedupeButtonVisuals(button) {
  [...button.querySelectorAll('img, svg')].slice(1).forEach(node => {
    node.dataset.viaticumDuplicateIcon = 'true';
  });

  const spans = [...button.querySelectorAll('span')];
  const seen = new Set();

  spans.forEach(span => {
    const text = textOf(span);
    if (!text) return;
    if (seen.has(text)) span.dataset.viaticumDuplicateIcon = 'true';
    seen.add(text);
  });
}

function markEditActionBar() {
  if (!isEditScreen()) return;

  const actionButtons = findEditActionButtons();
  if (actionButtons.length < 4) return;

  const parent = closestUsefulParent(actionButtons);
  if (!parent) return;

  parent.classList.add('vtm-edit-action-bar');
  actionButtons.forEach(button => {
    button.classList.add('vtm-edit-action-button');
    dedupeButtonVisuals(button);
  });
}

function markMonthPicker() {
  document.querySelector('.month-modal')?.classList.add('vtm-month-dropdown-modal');
  document.querySelector('.month-modal-backdrop')?.classList.add('vtm-month-dropdown-backdrop');
}

function runFixes() {
  markEditActionBar();
  markMonthPicker();
}

new MutationObserver(runFixes).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', runFixes);
window.addEventListener('hashchange', () => setTimeout(runFixes, 50));
setInterval(runFixes, 500);
runFixes();
