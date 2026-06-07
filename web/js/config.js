export const config = {
  appName: 'Viaticum',
  spreadsheetId: '1D8CT24J65KRPubakzrOCaYgavXGTKuo_86YBMjqGcyg',
  mainRange: 'sheet1!A2:I',
  refRange: 'ref!A2:Q',
  rawImageBaseUrl: 'https://raw.githubusercontent.com/cinaedvsstudios/Viaticum/main/',
  googleClientId: '1095336877076-4ni688klccnish4j4pl28nm40379lnvc.apps.googleusercontent.com',
  scopes: 'https://www.googleapis.com/auth/spreadsheets'
};
export const sheetUrl = () => `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`;
