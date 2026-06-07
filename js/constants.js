export const FALLBACK_ICONS = {
  Btn_Nav_Day:'📅', Btn_Nav_Trip:'🧳', Btn_Nav_Sheet:'🔗', Btn_Nav_Sync:'🔄', Btn_Nav_More:'🍔',
  Btn_Preview_Edit:'👁️', Btn_Save_Edit:'💾', Btn_Copy_Edit:'📋', Btn_Move_Edit:'🚚', Btn_Cancel_Edit:'❌',
  Icon_Share_Day:'📤', Icon_Clear_Day:'🗑️', Icon_Edit_Day:'✏️', Icon_ExpandAll:'↕️', Icon_Edit_Trip_Days:'✏️',
  Icon_Delete_Trip:'🗑️', Icon_UpArrow:'⬆️', Icon_DownArrow:'⬇️', Icon_Info:'ℹ️', Icon_Paid:'✅', Icon_Unpaid:'⚠️', Icon_Map:'🗺️',
  Banner_Syncing:'⏳ Syncing...', Banner_PrevCancel:'Cancel Preview'
};
export const FALLBACK_COLORS = {
  Bg_Main:'#ffffff', Text_Main:'#111111', Bar_BottomNav:'#f5f5f5', Header_Month_Bg:'#2196f3', Header_Month_Text:'#ffffff',
  Btn_Save:'#2196f3', Cal_PrevMonth:'#e5e7eb', Cal_EmptyDay:'transparent', Border_Schedule:'#ff9800', Header_Sched_Bg:'#2196f3',
  Header_Sched_Text:'#ffffff', Header_Prev_Bg:'#2196f3', Header_Prev_Text:'#ffffff', Prev_Sched_Bg:'#fff9c4', Prev_Detail_Bg:'#ffffff',
  Prev_Files_Bg:'#ffffff', Border_Details:'#90caf9', Border_Files:'#64b5f6', Border_Scroll:'#2196f3', Header_Day_Bg:'#2196f3',
  Header_Day_Text:'#ffffff', Day_Sched_Bg:'#fff9c4', Day_Sched_Border:'#ffa500', Day_Detail_Bg:'#ffffff', Day_Detail_Border:'#90caf9',
  Day_Files_Bg:'#ffffff', Day_Files_Border:'#64b5f6', Header_Edit_Bg:'#2196f3', Header_Edit_Text:'#ffffff', Bg_EditBox:'#ffffff',
  Header_Trip_Bg:'#2196f3', Header_Trip_Text:'#ffffff', Trip_Badge_Bg:'#2196f3', Trip_Closed_Bg:'#ffffff', Trip_Closed_Bord:'#ffa500',
  Trip_Open_Bg:'#e3f2fd', Trip_Open_Bord:'#2196f3', Trip_Sched_Bg:'#fff9c4', Trip_Sched_Bord:'#ffa500', Trip_Detail_Bg:'#ffffff',
  Trip_Detail_Bord:'#90caf9', Trip_Files_Bg:'#ffffff', Trip_Files_Bord:'#64b5f6', Banner_Sync:'#fff3cd'
};
export const DARK_FALLBACK_COLORS = { ...FALLBACK_COLORS, Bg_Main:'#121212', Text_Main:'#ffffff', Bar_BottomNav:'#171717', Prev_Detail_Bg:'#1e1e1e', Prev_Files_Bg:'#1e1e1e', Day_Detail_Bg:'#1e1e1e', Day_Files_Bg:'#1e1e1e', Trip_Closed_Bg:'#1e1e1e', Bg_EditBox:'#1e1e1e', Day_Sched_Bg:'#3a3315', Trip_Sched_Bg:'#3a3315' };
export const STORAGE_KEYS = { darkMode:'viaticum.darkMode', token:'viaticum.accessToken' };
export const DATE_FORMATS = ['yyyy-MM-dd','d/M/yyyy','dd/MM/yyyy'];
export const EXCLUDED_STATUS_KEYS = ['info','maps','paid','unpaid'];
