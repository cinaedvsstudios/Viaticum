export function normalizeStr(value='') {
  return String(value).toLowerCase().trim()
    .replaceAll('ö','oe').replaceAll('ä','ae').replaceAll('ü','ue').replaceAll('ß','ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
