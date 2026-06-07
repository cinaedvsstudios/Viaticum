export const blankEntry = (date='', rowIndex=-1) => ({ date, event:'', location:'', status:'', schedule:'', details:'', links:'', tripName:'', rowIndex });
export const travelEntry = (data={}) => ({ ...blankEntry(), ...data });
export const templateEntry = (target='', name='Template', text='') => ({ target, name, text });
export const refData = (data={}) => ({ statuses:{}, locations:{}, events:{}, locationImages:{}, eventImages:{}, schedules:{}, buttons:{}, templates:[], colorsLight:{}, colorsDark:{}, ...data });
