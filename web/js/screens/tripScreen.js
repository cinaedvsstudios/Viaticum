import { state,setState,trips } from '../state.js';
import { el,button } from '../utils/dom.js';
import { bottomNav } from '../components/bottomNav.js';
import { tripEntries,tripTitle,tripRange } from '../features/tripFeature.js';
import { pushRoute,goMain } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll } from '../services/syncService.js';

export function renderTripScreen(){
  const list=trips();
  const chosen=state.selectedTripName||list[0]||'';
  if(chosen!==state.selectedTripName)setState({selectedTripName:chosen});
  return el('main',{class:'screen trip-screen'},
    el('div',{class:'trip-desktop-grid'},tripList(list,chosen),tripDetail(chosen)),
    bottomNav(state.refData,{homeLabel:'Home',day:goMain,trip:()=>{},sheet:()=>window.open(sheetUrl(),'_blank','noopener'),sync:syncAll,more:()=>setState({modal:'more'})},'trip')
  );
}

function tripList(list