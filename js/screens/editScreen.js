import { state, setState, entryByDate, trips } from '../state.js';
import { el, button } from '../utils/dom.js';
import { addDays, formatLong } from '../utils/dates.js';
import { editableStatuses, templatesFor, adjacentDates, hasData } from '../features/editFeature.js';
import { saveDay, clearDay, moveDay, copyDay, entryForDate } from '../services/syncService.js';
import { pushRoute, goMain } from '../router/history.js';
import { iconFor } from '../components/iconButton.js';
export function renderEditScreen() {
  const original=entryForDate(state.selectedDate); const form={...original};
  const root=el('main', { class:'screen edit-screen' }, el('header', { class:'edit-header' }, button('‹',()=>{state.selectedDate=addDays(state.selectedDate,-1); pushRoute('edit');},'round-btn'), el('div',{}, el('h1',{},'Edit Day'), el('p',{},formatLong(form.date))), button('›',()=>{state.selectedDate=addDays(state.selectedDate,1); pushRoute('edit');},'round-btn')), formView(form));
  return root;
}
function formView(form) { const refs=state.refData; const root=el('form', { class:'edit-form', onSubmit:e=>e.preventDefault() }); const fields={};
  const addInput=(name,label,type='input')=>{ fields[name]= type==='textarea' ? el('textarea', { name }, form[name]) : el('input', { name, value:form[name] || '' }); root.append(el('label',{},el('span',{},label),fields[name])); };
  addInput('location','Location'); root.append(quickPick(refs.locations, v=>fields.location.value=v));
  addInput('event','Event'); root.append(quickPick(refs.events, v=>fields.event.value=v));
  root.append(el('label',{},el('span',{},'Status'), el('input', { name:'status', value:form.status || '' }))); fields.status=root.querySelector('[name=status]');
  root.append(el('div', { class:'quick-row' }, button('Erase',()=>fields.status.value='','chip-btn danger'), editableStatuses(refs).map(([name,emoji])=>button(emoji || name,()=>{ const vals=new Set(fields.status.value.split(/[|,]/).map(x=>x.trim()).filter(Boolean)); vals.has(name) ? vals.delete(name) : vals.add(name); fields.status.value=[...vals].join('|'); },'chip-btn'))));
  addInput('schedule','Schedule','textarea'); root.append(templateButtons(refs,'Schedule', t=>appendText(fields.schedule,t.text)));
  addInput('details','Details','textarea'); root.append(templateButtons(refs,'Details', t=>appendText(fields.details,t.text)));
  addInput('links','Links','textarea'); root.append(adjacentLinkButtons(fields.links)); root.append(templateButtons(refs,'Links', t=>appendText(fields.links,t.text)));
  addInput('tripName','Trip ID'); root.append(el('div', { class:'quick-row' }, trips().map(t=>button(t,()=>fields.tripName.value=t,'chip-btn')))); root.append(el('div', { class:'quick-row' }, adjacentDates(form.date).map(o=>button(`${o.offset>0?'+':''}${o.offset}`,()=>{ const e=entryByDate(o.date); if(e?.tripName) fields.tripName.value=e.tripName; },'chip-btn'))));
  root.append(el('footer', { class:'edit-actions' }, button(`${iconFor(refs,'Btn_Preview_Edit')} Preview`,()=>alert('Preview after saving opens the day screen.'),'btn'), button(`${iconFor(refs,'Btn_Save_Edit')} Save`,async()=>{ await saveDay(readForm(form,fields)); goMain(); },'btn save'), button(`${iconFor(refs,'Btn_Copy_Edit')} Copy`,async()=>{ const target=prompt('Copy to date (YYYY-MM-DD)', form.date); if(target) await copyDay({...readForm(form,fields), date:target, rowIndex:entryForDate(target).rowIndex}); },'btn'), button(`${iconFor(refs,'Btn_Move_Edit')} Move`,async()=>{ const target=prompt('Move to date (YYYY-MM-DD)', form.date); if(!target) return; const existing=entryForDate(target); if(hasData(existing) && !confirm('Target day already has data. Overwrite?')) return; await moveDay(form, {...readForm(form,fields), date:target, rowIndex:existing.rowIndex}); goMain(); },'btn'), button(`${iconFor(refs,'Icon_Clear_Day')} Clear`,async()=>confirm('Clear C:H only?') && clearDay(form),'btn danger'), button(`${iconFor(refs,'Btn_Cancel_Edit')} Cancel`,goMain,'btn'))); return root; }
function readForm(form, fields) { return { ...form, location:fields.location.value.trim(), event:fields.event.value.trim(), status:fields.status.value.trim(), schedule:fields.schedule.value.trim(), details:fields.details.value.trim(), links:fields.links.value.trim(), tripName:fields.tripName.value.trim() }; }
function quickPick(map, cb) { return el('div', { class:'quick-row' }, Object.entries(map||{}).map(([name,emoji])=>button(`${emoji} ${name}`,()=>cb(name),'chip-btn'))); }
function templateButtons(refData,target,cb) { const items=templatesFor(refData,target); return items.length ? el('div',{class:'quick-row'}, items.map(t=>button(t.name,()=>cb(t),'chip-btn'))) : ''; }
function appendText(field, text) { field.value = [field.value.trim(), text].filter(Boolean).join('\n'); }
function adjacentLinkButtons(field) { return el('div',{class:'quick-row'}, adjacentDates(state.selectedDate).map(o=>button(`Links ${o.offset>0?'+':''}${o.offset}`,()=>{ const e=entryByDate(o.date); if(e?.links) field.value=e.links; },'chip-btn'))); }
