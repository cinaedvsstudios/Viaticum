import { travelEntry } from '../models.js';
import { parseSheetDate } from '../utils/dates.js';
const cell = (row, i) => (row?.[i] ?? '').toString().trim();
export function parseEntryRows(rows=[]) {
  return rows.map((row, idx) => ({ row, rowIndex: idx + 2 })).filter(({row}) => cell(row,0)).map(({row,rowIndex}) => {
    const date = parseSheetDate(cell(row,0));
    return date ? travelEntry({ date, location:cell(row,2), event:cell(row,3), status:cell(row,4), schedule:cell(row,5), details:cell(row,6), links:cell(row,7), tripName:cell(row,8), rowIndex }) : null;
  }).filter(Boolean);
}
