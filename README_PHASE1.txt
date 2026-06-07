Viaticum web phase 1 visual/layout update.

This zip is rooted at the web app root. Copy the contents directly into the folder that contains css/, js/, index.html, and manifest.webmanifest.

Files included:
- css/responsive.css
- js/constants.js
- js/components/bottomNav.js
- js/components/imageBox.js
- js/screens/mainScreen.js
- js/screens/dayScreen.js
- js/screens/editScreen.js
- js/screens/tripScreen.js
- js/screens/moreSheet.js

Main changes:
- More is now Settings with a cog fallback icon.
- Settings opens as a styled modal/bottom sheet.
- Desktop main screen is a four-card dashboard: Calendar, Day, Schedule, Details.
- Mobile main screen order is Calendar, Day, Schedule, Details.
- Day screen styling is closer to the Android reference.
- Edit screen is grouped into styled cards with larger suggestion chips.
- Trip screen colour hierarchy is improved.
- Image loading tries local image folders before ref/GitHub fallback and shows a clean placeholder if missing.
