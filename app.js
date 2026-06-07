const STORAGE_KEY = "forever-bound-writing-room-v2";
const AUTH_KEY = "forever-bound-authenticated";
const AUTH_CONFIG_PATH = "config/auth.json";
const CONTENT_PATH = "content/documents.json";
const EDITOR_ENTRY = "editor.html";
const AUTOSAVE_DELAY = 600;
const DESIGN_KEY = "capsanoto-design-settings-v2";
const HELP_KEY = "capsanoto-help-html-v1";
const WRITING_ROOM_LAYOUT_KEY = "capsanoto-writing-room-layout-v1";
const FAVORITE_EMOJI_KEY = "capsanoto-favorite-emojis-v1";
const CUSTOM_EMOJI_KEY = "capsanoto-custom-emojis-v1";
const FOLDER_MODE_DB = "capsanoto-folder-mode-db-v1";
const FOLDER_MODE_STORE = "handles";
const FOLDER_MODE_HANDLE_KEY = "activeWritingRoomFolder";
const FOLDER_MODE_PREF_KEY = "capsanoto-folder-mode-prefs-v1";
const FOLDER_MODE_CHECK_INTERVAL = 10 * 60 * 1000;
const GOOGLE_DRIVE_CLIENT_ID = "914452234615-eqsti2er404bhih80jnjemsfc68boso5.apps.googleusercontent.com";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_STORAGE_KEY = "capsanoto-google-drive-storage-v1";
const GOOGLE_DRIVE_TOKEN_STORAGE_KEY = "capsanoto-google-drive-token-v1";
const GOOGLE_DRIVE_API_ROOT = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_ROOT = "https://www.googleapis.com/upload/drive/v3";
const GOOGLE_DRIVE_ROOT_FOLDER_NAME = "Capsanoto";
const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const CAPSANOTO_THEME_VERSION = "warm-copper-v2";
const FILING_HIERARCHY_VERSION = 1;

const CAPSANOTO_PALETTE = {
  black: "#000000",
  deepPlum: "#28133f",
  espresso: "#211812",
  amethyst: "#563485",
  clay: "#724837",
  ochre: "#a97b38",
  ember: "#c55222",
  peach: "#e88f69",
  umber: "#2f251c",
  charcoal: "#2c2c2c",
  parchment: "#fbf4d6",
};

const DEFAULT_FAVORITE_COLORS = [
  CAPSANOTO_PALETTE.black,
  CAPSANOTO_PALETTE.espresso,
  CAPSANOTO_PALETTE.umber,
  CAPSANOTO_PALETTE.charcoal,
  CAPSANOTO_PALETTE.clay,
  CAPSANOTO_PALETTE.ochre,
  CAPSANOTO_PALETTE.ember,
  CAPSANOTO_PALETTE.peach,
  CAPSANOTO_PALETTE.deepPlum,
  CAPSANOTO_PALETTE.amethyst,
  CAPSANOTO_PALETTE.parchment,
];

const DEFAULT_WORKSPACE = {
  schemaVersion: 2,
  updatedAt: "2026-05-08T00:00:00.000Z",
  documents: [
    {
      id: "episode-01",
      title: "Episode 01",
      tags: ["season-1", "episode"],
      updatedAt: "2026-05-07T00:00:00.000Z",
      content: '<h1 id="episode-01">Episode 01</h1><p>Draft the episode here in a clean writing environment.</p><h2 id="synopsis">Synopsis</h2><p>Write the episode summary.</p><h2 id="canon-notes">Canon Notes</h2><p>Use reusable TCards for shared lore, such as {{Location-Ironvale}}.</p><h2 id="structure">Structure</h2><table><thead><tr><th>Beat</th><th>Notes</th></tr></thead><tbody><tr><td>Opening</td><td></td></tr><tr><td>Turn</td><td></td></tr><tr><td>Ending</td><td></td></tr></tbody></table>',
    },
    {
      id: "Character-Mel-Ameldra",
      title: "Character Mel Ameldra",
      tags: ["character", "example", "deep-link"],
      updatedAt: "2026-05-08T00:00:00.000Z",
      content: '<h1 id="Overview">Character Mel Ameldra</h1><p>This starter profile demonstrates document URLs like <code>editor.html?doc=Character-Mel-Ameldra</code>.</p><h2 id="Runestones">Runestones</h2><p>This section demonstrates direct bookmark URLs like <code>editor.html?doc=Character-Mel-Ameldra#Runestones</code>.</p><h2 id="Relationships">Relationships</h2><p>Add linked characters, factions, and locations here.</p>',
    },
  ],
  blocks: {
    "Item-Runestones": {
      id: "Item-Runestones",
      content: "Runestones are reusable canon items that can be referenced across lore documents without duplicating text.",
      updatedAt: "2026-05-07T00:00:00.000Z",
    },
    "Location-Ironvale": {
      id: "Location-Ironvale",
      content: "Ironvale is a sample location TCard used to demonstrate how edits update every {{Location-Ironvale}} reference.",
      updatedAt: "2026-05-07T00:00:00.000Z",
    },
  },
};

const state = {
  documents: [],
  blocks: {},
  activeId: null,
  saveTimer: null,
  pendingBookmarkId: "",
  suppressInput: false,
  sharedPassword: "",
  authReady: false,
  exportItems: [],
  draggedExportIndex: null,
  savedRange: null,
  dialogResolver: null,
  writingRoomDrag: null,
  panelDrag: null,
  filingEditMode: false,
  writingRoomName: "Writing Room",
  filingGroups: [],
  filingTabs: [],
  trash: [],
  deprecated: [],
  deprecatedParagraphs: [],
  draggedDocId: "",
  draggedTabId: "",
  draggedEditorNode: null,
  activeTable: null,
  tableEditTimer: null,
  activeTableCell: null,
  cabinetScrollDrag: null,
  lastColorInput: null,
  favoriteColors: [...DEFAULT_FAVORITE_COLORS],
  favoriteEmojis: [],
  customEmojis: [],
  blockDeleteMode: false,
  inlineTCardEditId: "",
  emojiDrag: null,
  settingsDirty: false,
  designSettings: {},
  contextStatusLocked: false,
  contextStatusTimer: null,
  folderMode: {
    enabled: false,
    supported: typeof window !== "undefined" && "showDirectoryPicker" in window,
    directoryHandle: null,
    projectName: "",
    lastDiskSaveAt: "",
    reminderTimer: null,
    reminderOpen: false,
    writeInProgress: false,
  },
  googleDrive: {
    tokenClient: null,
    accessToken: "",
    connected: false,
    connectedAt: "",
    expiresAt: "",
    accountLabel: "",
    lastStatus: "Not connected",
    initError: "",
    rootFolderId: "",
    projectFolderId: "",
    projectName: "",
    lastSyncAt: "",
  },
};

const els = {
  passwordScreen: document.querySelector("#passwordScreen"),
  passwordForm: document.querySelector("#passwordForm"),
  passwordInput: document.querySelector("#passwordInput"),
  passwordError: document.querySelector("#passwordError"),
  passwordSubmit: document.querySelector("#passwordForm button[type='submit']"),
  editorApp: document.querySelector("#editorApp"),
  documentSelect: document.querySelector("#documentSelect"),
  newDocumentButton: document.querySelector("#newDocumentButton"),
  documentSettingsButton: document.querySelector("#documentSettingsButton"),
  contextStatus: document.querySelector("#contextStatus"),
  saveStatus: document.querySelector("#saveStatus"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsPanel: document.querySelector("#settingsPanel"),
  projectSettingsPanel: document.querySelector("#projectSettingsPanel"),
  projectSettingsButton: document.querySelector("#projectSettingsButton"),
  closeProjectSettingsPanel: document.querySelector("#closeProjectSettingsPanel"),
  projectInfoStatus: document.querySelector("#projectInfoStatus"),
  googleDriveStatus: document.querySelector("#googleDriveStatus"),
  connectGoogleDriveButton: document.querySelector("#connectGoogleDriveButton"),
  switchGoogleDriveButton: document.querySelector("#switchGoogleDriveButton"),
  disconnectGoogleDriveButton: document.querySelector("#disconnectGoogleDriveButton"),
  createOnlineProjectButton: document.querySelector("#createOnlineProjectButton"),
  openOnlineProjectButton: document.querySelector("#openOnlineProjectButton"),
  syncOnlineProjectButton: document.querySelector("#syncOnlineProjectButton"),
  checkOnlineStatusButton: document.querySelector("#checkOnlineStatusButton"),
  openGoogleDriveFolderButton: document.querySelector("#openGoogleDriveFolderButton"),
  copyGoogleDriveFolderLinkButton: document.querySelector("#copyGoogleDriveFolderLinkButton"),
  projectFolderModeStatus: document.querySelector("#projectFolderModeStatus"),
  projectCreateBackupFolderButton: document.querySelector("#projectCreateBackupFolderButton"),
  projectOpenBackupFolderButton: document.querySelector("#projectOpenBackupFolderButton"),
  projectSaveBackupButton: document.querySelector("#projectSaveBackupButton"),
  projectSyncBackupFolderButton: document.querySelector("#projectSyncBackupFolderButton"),
  projectCheckBackupStatusButton: document.querySelector("#projectCheckBackupStatusButton"),
  projectResetBackupReminderButton: document.querySelector("#projectResetBackupReminderButton"),
  newProjectPlaceholderButton: document.querySelector("#newProjectPlaceholderButton"),
  openProjectPlaceholderButton: document.querySelector("#openProjectPlaceholderButton"),
  duplicateProjectPlaceholderButton: document.querySelector("#duplicateProjectPlaceholderButton"),
  downloadProjectBackupButton: document.querySelector("#downloadProjectBackupButton"),
  projectImportBackupButton: document.querySelector("#projectImportBackupButton"),
  importProjectBackupButton: document.querySelector("#importProjectBackupButton"),
  importProjectBackupInput: document.querySelector("#importProjectBackupInput"),
  closeSettingsPanel: document.querySelector("#closeSettingsPanel"),
  saveSettingsPanelButton: document.querySelector("#saveSettingsPanelButton"),
  settingsEmojiLibraryButton: document.querySelector("#settingsEmojiLibraryButton"),
  logoutButton: document.querySelector("#logoutButton"),
  toolbar: document.querySelector(".toolbar"),
  linkButton: document.querySelector("#linkButton"),
  editLinkButton: document.querySelector("#editLinkButton"),
  pillLinkButton: document.querySelector("#pillLinkButton"),
  removeLinkButton: document.querySelector("#removeLinkButton"),
  bookmarkButton: document.querySelector("#bookmarkButton"),
  tableButton: document.querySelector("#tableButton"),
  imageButton: document.querySelector("#imageButton"),
  imageInput: document.querySelector("#imageInput"),
  emojiButton: document.querySelector("#emojiButton"),
  searchButton: document.querySelector("#searchButton"),
  subnotoButton: document.querySelector("#subnotoButton"),
  blockButton: document.querySelector("#blockButton"),
  emphasisButton: document.querySelector("#emphasisButton"),
  topHelpButton: document.querySelector("#topHelpButton"),
  helpButton: document.querySelector("#helpButton"),
  exportSourceType: document.querySelector("#exportSourceType"),
  exportSourceSelect: document.querySelector("#exportSourceSelect"),
  addExportItemButton: document.querySelector("#addExportItemButton"),
  exportQueue: document.querySelector("#exportQueue"),
  exportCapsButton: document.querySelector("#exportCapsButton"),
  exportTxtButton: document.querySelector("#exportTxtButton"),
  exportHtmlButton: document.querySelector("#exportHtmlButton"),
  exportDocButton: document.querySelector("#exportDocButton"),
  designButtonBg: document.querySelector("#designButtonBg"),
  designBorderColor: document.querySelector("#designBorderColor"),
  designTextColor: document.querySelector("#designTextColor"),
  designFontSize: document.querySelector("#designFontSize"),
  designFontFamily: document.querySelector("#designFontFamily"),
  titleIconScale: document.querySelector("#titleIconScale"),
  designBold: document.querySelector("#designBold"),
  designBgImage: document.querySelector("#designBgImage"),
  dialogBgColor: document.querySelector("#dialogBgColor"),
  dialogBorderColor: document.querySelector("#dialogBorderColor"),
  dialogShadowColor: document.querySelector("#dialogShadowColor"),
  dialogTextColor: document.querySelector("#dialogTextColor"),
  dialogFontSize: document.querySelector("#dialogFontSize"),
  dialogBold: document.querySelector("#dialogBold"),
  dialogButtonBg: document.querySelector("#dialogButtonBg"),
  dialogButtonBorder: document.querySelector("#dialogButtonBorder"),
  dialogButtonText: document.querySelector("#dialogButtonText"),
  dialogButtonShadow: document.querySelector("#dialogButtonShadow"),
  labelTextColor: document.querySelector("#labelTextColor"),
  dynamicTextColor: document.querySelector("#dynamicTextColor"),
  scrollbarTrackColor: document.querySelector("#scrollbarTrackColor"),
  scrollbarThumbColor: document.querySelector("#scrollbarThumbColor"),
  statusBgColor: document.querySelector("#statusBgColor"),
  statusBorderColor: document.querySelector("#statusBorderColor"),
  statusTextColor: document.querySelector("#statusTextColor"),
  emphasisBgColor: document.querySelector("#emphasisBgColor"),
  emphasisBorderColor: document.querySelector("#emphasisBorderColor"),
  emphasisTextColor: document.querySelector("#emphasisTextColor"),
  panelBgColor: document.querySelector("#panelBgColor"),
  panelBorderColor: document.querySelector("#panelBorderColor"),
  designBoldToggle: document.querySelector("#designBoldToggle"),
  dialogBoldToggle: document.querySelector("#dialogBoldToggle"),
  activeColorHex: document.querySelector("#activeColorHex"),
  currentColorBox: document.querySelector("#currentColorBox"),
  favoriteColors: document.querySelector("#favoriteColors"),
  importColorImageButton: document.querySelector("#importColorImageButton"),
  colorImageInput: document.querySelector("#colorImageInput"),
  colorImagePopup: document.querySelector("#colorImagePopup"),
  colorImagePreview: document.querySelector("#colorImagePreview"),
  closeColorImagePopup: document.querySelector("#closeColorImagePopup"),
  favoriteEmojiInput: document.querySelector("#favoriteEmojiInput"),
  saveFavoriteEmojiButton: document.querySelector("#saveFavoriteEmojiButton"),
  settingsSearchInput: document.querySelector("#settingsSearchInput"),
  settingsSearchPrev: document.querySelector("#settingsSearchPrev"),
  settingsSearchNext: document.querySelector("#settingsSearchNext"),
  settingsSearchCount: document.querySelector("#settingsSearchCount"),
  expandDesignerCards: document.querySelector("#expandDesignerCards"),
  collapseDesignerCards: document.querySelector("#collapseDesignerCards"),
  settingsMenu: document.querySelector(".settings-menu"),
  createFolderProjectButton: document.querySelector("#createFolderProjectButton"),
  openFolderProjectButton: document.querySelector("#openFolderProjectButton"),
  saveFolderProjectButton: document.querySelector("#saveFolderProjectButton"),
  syncFolderProjectButton: document.querySelector("#syncFolderProjectButton"),
  resetFolderReminderButton: document.querySelector("#resetFolderReminderButton"),
  folderModeStatus: document.querySelector("#folderModeStatus"),
  folderModeStructure: document.querySelector("#folderModeStructure"),
  settingsSections: document.querySelectorAll("[data-settings-section]"),
  writingRoomButton: document.querySelector("#writingRoomButton"),
  writingRoomPanel: document.querySelector("#writingRoomPanel"),
  writingRoomPanelHeader: document.querySelector("#writingRoomPanelHeader"),
  writingRoomTitle: document.querySelector("#writingRoomTitle"),
  closeWritingRoomPanel: document.querySelector("#closeWritingRoomPanel"),
  editWritingRoomButton: document.querySelector("#editWritingRoomButton"),
  saveWritingRoomLayoutButton: document.querySelector("#saveWritingRoomLayoutButton"),
  writingRoomEditBar: document.querySelector("#writingRoomEditBar"),
  newFolderButton: document.querySelector("#newFolderButton"),
  newTabButton: document.querySelector("#newTabButton"),
  trashCanButton: document.querySelector("#trashCanButton"),
  writingRoomCards: document.querySelector("#writingRoomCards"),
  selectionMenu: document.querySelector("#selectionMenu"),
  dialogOverlay: document.querySelector("#dialogOverlay"),
  dialogBox: document.querySelector("#dialogBox"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogFields: document.querySelector("#dialogFields"),
  dialogCancelButton: document.querySelector("#dialogCancelButton"),
  applyDesignButton: document.querySelector("#applyDesignButton"),
  resetDesignButton: document.querySelector("#resetDesignButton"),
  helpPanel: document.querySelector("#helpPanel"),
  helpEditButton: document.querySelector("#helpEditButton"),
  closeHelpPanel: document.querySelector("#closeHelpPanel"),
  bookmarkBar: document.querySelector("#bookmarkBar"),
  titleInput: document.querySelector("#titleInput"),
  tagsInput: document.querySelector("#tagsInput"),
  editor: document.querySelector("#editor"),
  documentEndBar: document.querySelector("#documentEndBar"),
  writingAssistRail: document.querySelector("#writingAssistRail"),
  blockPanel: document.querySelector("#blockPanel"),
  closeBlockPanel: document.querySelector("#closeBlockPanel"),
  blockIdInput: document.querySelector("#blockIdInput"),
  blockContentInput: document.querySelector("#blockContentInput"),
  blockBgInput: document.querySelector("#blockBgInput"),
  blockBorderInput: document.querySelector("#blockBorderInput"),
  blockTextInput: document.querySelector("#blockTextInput"),
  blockHeadingInput: document.querySelector("#blockHeadingInput"),
  blockTextSizeInput: document.querySelector("#blockTextSizeInput"),
  saveBlockButton: document.querySelector("#saveBlockButton"),
  insertBlockRefButton: document.querySelector("#insertBlockRefButton"),
  deleteBlockButton: document.querySelector("#deleteBlockButton"),
  editBlockInlineButton: document.querySelector("#editBlockInlineButton"),
  blockList: document.querySelector("#blockList"),
  documentTemplate: document.querySelector("#documentTemplate"),
};

boot().catch((error) => {
  console.error(error);
  showEditorStartupError(error);
});

async function boot() {
  markFrameMode();
  await startEditor();
}

async function loadAuthConfig() {
  const errors = [];
  for (const url of authConfigUrls()) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      const config = await response.json();
      if (config.sharedPassword) {
        state.sharedPassword = config.sharedPassword;
        return;
      }
      throw new Error("Missing sharedPassword");
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  const fallbackPassword = els.passwordForm.dataset.sharedPassword;
  if (fallbackPassword) {
    console.warn(`Using embedded Capsanoto password fallback after config load failed: ${errors.join(" | ")}`);
    state.sharedPassword = fallbackPassword;
    return;
  }

  throw new Error(`Unable to load ${AUTH_CONFIG_PATH}. Tried ${errors.join(" | ")}`);
}

function authConfigUrls() {
  const urls = [];
  addUniqueUrl(urls, AUTH_CONFIG_PATH, document.baseURI);
  addUniqueUrl(urls, AUTH_CONFIG_PATH, location.href);
  const scriptSrc = document.currentScript?.src || document.querySelector('script[src$="app.js"]')?.src;
  if (scriptSrc) addUniqueUrl(urls, AUTH_CONFIG_PATH, scriptSrc);
  if (location.origin && location.origin !== "null") addUniqueUrl(urls, `/${AUTH_CONFIG_PATH}`, location.origin);
  return urls;
}

function addUniqueUrl(urls, path, base) {
  try {
    const url = new URL(path, base).href;
    if (!urls.includes(url)) urls.push(url);
  } catch (error) {
    console.warn("Skipping invalid auth config URL", path, base, error);
  }
}

function bindAuthEvents() {
  if (els.passwordForm.dataset.bound === "true") return;
  els.passwordForm.dataset.bound = "true";

  els.passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.authReady || !state.sharedPassword) {
      showPasswordScreen("Password settings are still loading. Try again in a moment.");
      return;
    }
    if (els.passwordInput.value !== state.sharedPassword) {
      showPasswordScreen("That password did not match the Writing Room password.");
      return;
    }

    localStorage.setItem(AUTH_KEY, "true");
    els.passwordInput.value = "";
    setPasswordFormState(false, "Opening Writing Room…");
    try {
      await startEditor();
      setPasswordFormState(true);
    } catch (error) {
      console.error(error);
      localStorage.removeItem(AUTH_KEY);
      setPasswordFormState(true);
      showPasswordScreen("Password accepted, but the editor could not initialize. Refresh the page and try again.");
    }
  });

  els.logoutButton.addEventListener("click", () => {
    localStorage.removeItem(AUTH_KEY);
    showPasswordScreen();
  });
}

async function startEditor() {
  setAuthVisibility(true);
  await loadWorkspace();
  applySavedDesignSettings();
  await restoreFolderModeHandle();
  loadGoogleDriveStorageState();
  loadFavoriteEmojis();
  hydrateIconButtons();
  bindEditorEvents();
  applyRouteToState();
  loadEditableHelp();
  renderAll();
  if (!new URLSearchParams(location.search).has("doc")) updateUrl();
  scrollToRouteBookmark();
  setStatus("Ready", "saved");
  updateContextStatus();
  startFolderModeReminderLoop();
  updateFolderModeStatus();
}

function showPasswordScreen(message = "") {
  setAuthVisibility(false);
  els.passwordError.textContent = message;
  requestAnimationFrame(() => els.passwordInput.focus());
}

function setPasswordFormState(enabled, message = "") {
  els.passwordInput.disabled = !enabled;
  els.passwordSubmit.disabled = !enabled;
  els.passwordError.textContent = message;
}

function showEditorStartupError(error) {
  setAuthVisibility(true);
  const message = error?.message || "Unknown startup error";
  els.editor.innerHTML = `<h1>Capsanoto startup issue</h1><p>The editor is unlocked, but startup hit an error:</p><pre>${escapeHtml(message)}</pre><p>Try refreshing. If this keeps happening, use Reset Local Save in Settings.</p>`;
  setStatus("Startup issue", "dirty");
}

function setAuthVisibility(isUnlocked) {
  document.body.classList.toggle("is-locked", !isUnlocked);
  document.body.classList.toggle("is-unlocked", isUnlocked);
  els.passwordScreen.hidden = isUnlocked;
  els.editorApp.hidden = !isUnlocked;
  els.passwordScreen.setAttribute("aria-hidden", String(isUnlocked));
  els.editorApp.setAttribute("aria-hidden", String(!isUnlocked));
}

function markFrameMode() {
  try {
    if (window.self !== window.top) document.body.classList.add("is-framed");
  } catch {
    document.body.classList.add("is-framed");
  }
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

async function loadWorkspace() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const payload = JSON.parse(saved);
      state.documents = Array.isArray(payload.documents) ? payload.documents : [];
      state.blocks = payload.blocks && typeof payload.blocks === "object" ? payload.blocks : {};
      state.writingRoomName = payload.writingRoomName || state.writingRoomName;
      state.filingGroups = Array.isArray(payload.filingGroups) ? payload.filingGroups : [];
      state.filingTabs = Array.isArray(payload.filingTabs) ? payload.filingTabs : [];
      state.trash = Array.isArray(payload.trash) ? payload.trash : [];
      state.deprecated = Array.isArray(payload.deprecated) ? payload.deprecated : [];
      state.deprecatedParagraphs = Array.isArray(payload.deprecatedParagraphs) ? payload.deprecatedParagraphs : [];
      if (payload.designSettings && typeof payload.designSettings === "object") setProjectDesignSettings(payload.designSettings, { persistLocal: true });
      if (payload.designSettings && typeof payload.designSettings === "object") setProjectDesignSettings(payload.designSettings, { persistLocal: true });
    } catch (error) {
      console.warn("Ignoring unreadable local Capsanoto Writing Room", error);
      localStorage.removeItem(STORAGE_KEY);
      state.documents = [];
      state.blocks = {};
    }
  }

  if (!state.documents.length) {
    const payload = await loadStarterWorkspace();
    state.documents = Array.isArray(payload.documents) ? payload.documents : [];
    state.blocks = payload.blocks && typeof payload.blocks === "object" ? payload.blocks : {};
    state.writingRoomName = payload.writingRoomName || state.writingRoomName;
    state.filingGroups = Array.isArray(payload.filingGroups) ? payload.filingGroups : [];
    state.filingTabs = Array.isArray(payload.filingTabs) ? payload.filingTabs : [];
    state.trash = Array.isArray(payload.trash) ? payload.trash : [];
    state.deprecated = Array.isArray(payload.deprecated) ? payload.deprecated : [];
    state.deprecatedParagraphs = Array.isArray(payload.deprecatedParagraphs) ? payload.deprecatedParagraphs : [];
    persistNow("Loaded starter Writing Room");
  }

  normalizeFilingHierarchy();
  if (!state.documents.length) createDocument();
  state.activeId = state.documents[0].id;
}

async function loadStarterWorkspace() {
  const errors = [];
  for (const url of contentWorkspaceUrls()) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      const payload = await response.json();
      if (Array.isArray(payload.documents)) return payload;
      throw new Error("Missing documents array");
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  console.warn(`Using embedded Capsanoto starter Writing Room after content load failed: ${errors.join(" | ")}`);
  return cloneDefaultWorkspace();
}

function contentWorkspaceUrls() {
  const urls = [];
  addUniqueUrl(urls, CONTENT_PATH, document.baseURI);
  addUniqueUrl(urls, CONTENT_PATH, location.href);
  const scriptSrc = document.currentScript?.src || document.querySelector('script[src$="app.js"]')?.src;
  if (scriptSrc) addUniqueUrl(urls, CONTENT_PATH, scriptSrc);
  if (location.origin && location.origin !== "null") addUniqueUrl(urls, `/${CONTENT_PATH}`, location.origin);
  return urls;
}

function cloneDefaultWorkspace() {
  return JSON.parse(JSON.stringify(DEFAULT_WORKSPACE));
}

function bindEditorEvents() {
  if (els.editor.dataset.bound === "true") return;
  els.editor.dataset.bound = "true";

  els.documentSelect.addEventListener("change", () => openDocument(els.documentSelect.value));
  els.newDocumentButton.addEventListener("click", () => {
    const doc = createDocument();
    openDocument(doc.id);
    markDirty("New document created");
  });
  els.documentSettingsButton?.addEventListener("click", openFilingCabinetSettingsMode);

  els.titleInput.addEventListener("input", () => {
    activeDocument().title = els.titleInput.value || "Untitled Document";
    renderDocumentSelect();
    updateUrl();
    markDirty("Title updated");
  });

  els.tagsInput.addEventListener("input", () => {
    activeDocument().tags = els.tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean);
    markDirty("Tags updated");
  });

  els.editor.addEventListener("input", () => {
    if (state.suppressInput) return;
    syncEditorToDocument();
    renderBookmarks();
    updateContextStatus();
    markDirty("Saving locally");
  });
  els.editor.addEventListener("keyup", updateContextStatus);
  els.editor.addEventListener("mouseup", updateContextStatus);
  document.addEventListener("selectionchange", updateContextStatus);
  document.addEventListener("mouseover", updateHoverStatus);
  document.addEventListener("focusin", updateHoverStatus);

  els.toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.command) runCommand(button.dataset.command);
    if (button.dataset.block) formatBlock(button.dataset.block);
  });

  els.linkButton.addEventListener("click", createHyperlink);
  els.editLinkButton.addEventListener("click", editSelectedLink);
  els.pillLinkButton.addEventListener("click", createPillLink);
  els.removeLinkButton.addEventListener("click", removeSelectedLink);
  els.bookmarkButton.addEventListener("click", insertBookmark);
  els.tableButton.addEventListener("click", insertTable);
  els.imageButton.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", embedSelectedImage);
  els.emojiButton.addEventListener("click", showEmojiPicker);
  els.searchButton?.addEventListener("click", () => setContextStatus("Specnoto search/find placeholder will be built later", "saved"));
  els.subnotoButton?.addEventListener("click", () => openSubnotoWindow());
  document.querySelector('.tool-menu-trigger[data-tool-name="Subnoto"]')?.addEventListener("click", openSubnotoWindow);
  els.emphasisButton.addEventListener("click", insertEmphasisBox);
  els.topHelpButton.addEventListener("click", () => toggleHelpPanel(true));
  els.settingsButton.addEventListener("click", () => toggleSettingsPanel(true));
  els.projectSettingsButton?.addEventListener("click", () => toggleProjectSettingsPanel(true));
  els.closeProjectSettingsPanel?.addEventListener("click", () => toggleProjectSettingsPanel(false));
  els.connectGoogleDriveButton?.addEventListener("click", () => connectGoogleDriveAccount(false));
  els.switchGoogleDriveButton?.addEventListener("click", () => connectGoogleDriveAccount(true));
  els.disconnectGoogleDriveButton?.addEventListener("click", disconnectGoogleDriveAccount);
  els.createOnlineProjectButton?.addEventListener("click", createGoogleDriveOnlineProject);
  els.openOnlineProjectButton?.addEventListener("click", openGoogleDriveOnlineProject);
  els.syncOnlineProjectButton?.addEventListener("click", syncGoogleDriveProject);
  els.checkOnlineStatusButton?.addEventListener("click", checkGoogleDriveProjectStatus);
  els.openGoogleDriveFolderButton?.addEventListener("click", openGoogleDriveProjectFolder);
  els.copyGoogleDriveFolderLinkButton?.addEventListener("click", copyGoogleDriveProjectLink);
  els.projectCreateBackupFolderButton?.addEventListener("click", createNewWritingRoomFolder);
  els.projectOpenBackupFolderButton?.addEventListener("click", openWritingRoomFolder);
  els.projectSaveBackupButton?.addEventListener("click", () => saveFolderModeSnapshot("Backed up active file to disk", { force: true }));
  els.projectSyncBackupFolderButton?.addEventListener("click", syncLocalBackupFolder);
  els.projectCheckBackupStatusButton?.addEventListener("click", checkLocalBackupStatus);
  els.projectResetBackupReminderButton?.addEventListener("click", resetFolderModeReminderPreference);
  els.newProjectPlaceholderButton?.addEventListener("click", createNewWritingRoomProject);
  els.openProjectPlaceholderButton?.addEventListener("click", openGoogleDriveOnlineProject);
  els.duplicateProjectPlaceholderButton?.addEventListener("click", duplicateGoogleDriveProject);
  els.downloadProjectBackupButton?.addEventListener("click", downloadCapsanotoProjectBackup);
  els.projectImportBackupButton?.addEventListener("click", triggerProjectBackupImport);
  els.importProjectBackupButton?.addEventListener("click", triggerProjectBackupImport);
  els.importProjectBackupInput?.addEventListener("change", importProjectBackupFromInput);
  els.closeSettingsPanel.addEventListener("pointerdown", (event) => event.stopPropagation());
  els.closeSettingsPanel.addEventListener("pointerup", (event) => { event.preventDefault(); event.stopPropagation(); toggleSettingsPanel(false); });
  els.closeSettingsPanel.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); toggleSettingsPanel(false); });
  els.saveSettingsPanelButton?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); saveSettingsAndClose(); });
  els.settingsEmojiLibraryButton?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); showEmojiPicker(event); });
  document.querySelectorAll("#openTcardPanelButton").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); saveSelectionRange(); toggleBlockPanel(true); }));
  document.addEventListener("click", handleGlobalSettingsCloseClick, true);
  document.addEventListener("pointerup", handleGlobalSettingsCloseClick, true);
  els.settingsMenu.addEventListener("click", handleSettingsMenuClick);
  els.settingsPanel.addEventListener("click", handleSettingsCardToggle);
  els.settingsPanel.addEventListener("input", markSettingsDirtyFromEvent);
  els.settingsPanel.addEventListener("change", markSettingsDirtyFromEvent);
  els.settingsPanel.addEventListener("input", (event) => { if (event.target.matches?.(".icon-text-input")) refreshIconInputPreviews(); });
  els.settingsSearchInput?.addEventListener("input", handleSettingsSearchInput);
  els.settingsSearchNext?.addEventListener("click", () => moveSettingsSearch(1));
  els.settingsSearchPrev?.addEventListener("click", () => moveSettingsSearch(-1));
  els.createFolderProjectButton?.addEventListener("click", createNewWritingRoomFolder);
  els.openFolderProjectButton?.addEventListener("click", openWritingRoomFolder);
  els.saveFolderProjectButton?.addEventListener("click", () => saveFolderModeSnapshot("Saved to disk", { force: true }));
  els.syncFolderProjectButton?.addEventListener("click", syncLocalBackupFolder);
  els.resetFolderReminderButton?.addEventListener("click", resetFolderModeReminderPreference);
  els.importColorImageButton?.addEventListener("click", () => els.colorImageInput?.click());
  els.colorImageInput?.addEventListener("change", showColorReferenceImage);
  els.closeColorImagePopup?.addEventListener("click", () => { if (els.colorImagePopup) els.colorImagePopup.hidden = true; });
  els.saveFavoriteEmojiButton?.addEventListener("click", saveFavoriteEmojisFromSettings);
  els.writingRoomButton.addEventListener("click", () => toggleWritingRoomPanel());
  els.closeWritingRoomPanel.addEventListener("click", () => toggleWritingRoomPanel(false));
  els.editWritingRoomButton.addEventListener("click", toggleFilingEditMode);
  els.saveWritingRoomLayoutButton?.addEventListener("click", saveWritingRoomPanelLayout);
  els.newFolderButton.addEventListener("click", () => createFilingGroup("folder"));
  els.newTabButton.addEventListener("click", createFilingTab);
  els.trashCanButton?.addEventListener("click", () => setContextStatus(`${state.trash.length} items in Trash · ${state.deprecated.length} deprecated`, false));
  els.writingRoomCards.addEventListener("click", handleWritingRoomCardClick);
  els.writingRoomCards.addEventListener("focusout", handleFilingInlineEdit);
  els.writingRoomCards.addEventListener("keydown", handleFilingInlineKeydown);
  els.writingRoomCards.addEventListener("dragstart", handleFilingDragStart);
  els.writingRoomCards.addEventListener("dragover", handleFilingDragOver);
  els.writingRoomCards.addEventListener("drop", handleFilingDrop);
  els.writingRoomCards.addEventListener("pointerdown", startCabinetScrollDrag);
  window.addEventListener("pointermove", moveCabinetScrollDrag);
  window.addEventListener("pointerup", stopCabinetScrollDrag);
  els.documentEndBar?.addEventListener("click", handleDocumentEndBarClick);
  els.writingRoomPanelHeader.addEventListener("pointerdown", startWritingRoomDrag);
  window.addEventListener("pointermove", moveWritingRoomPanel);
  window.addEventListener("pointerup", stopWritingRoomDrag);
  els.settingsPanel.querySelector("header")?.addEventListener("pointerdown", (event) => startPanelDrag(event, els.settingsPanel));
  els.helpPanel.querySelector("header")?.addEventListener("pointerdown", (event) => startPanelDrag(event, els.helpPanel));
  els.projectSettingsPanel?.querySelector("header")?.addEventListener("pointerdown", (event) => startPanelDrag(event, els.projectSettingsPanel));
  window.addEventListener("pointermove", movePanelDrag);
  window.addEventListener("pointerup", stopPanelDrag);
  window.addEventListener("resize", renderWritingAssistRail);
  window.addEventListener("scroll", updateWritingAssistRailPosition, { passive: true });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { toggleHelpPanel(false); toggleSettingsPanel(false); toggleProjectSettingsPanel(false); toggleWritingRoomPanel(false); } });
  bindDesignColorTools();
  bindInheritanceToggles();
  bindElementDesignerCardScroll();
  els.expandDesignerCards?.addEventListener("click", () => setElementDesignerCards(true));
  els.collapseDesignerCards?.addEventListener("click", () => setElementDesignerCards(false));
  bindDesignToggle(els.designBoldToggle, els.designBold);
  bindDesignToggle(els.dialogBoldToggle, els.dialogBold);
  els.helpButton.addEventListener("click", () => { toggleSettingsPanel(false); toggleHelpPanel(true); });
  els.helpEditButton?.addEventListener("click", toggleHelpEditMode);
  els.closeHelpPanel.addEventListener("click", () => toggleHelpPanel(false));
  els.logoutButton.addEventListener("click", resetLocalWorkspace);
  els.exportSourceType.addEventListener("change", renderExportSourceSelect);
  els.addExportItemButton.addEventListener("click", addExportItem);
  els.exportCapsButton.addEventListener("click", () => exportSmartBundle("caps"));
  els.exportTxtButton.addEventListener("click", () => exportSmartBundle("txt"));
  els.exportHtmlButton.addEventListener("click", () => exportSmartBundle("html"));
  els.exportDocButton.addEventListener("click", () => exportSmartBundle("doc"));
  els.exportQueue.addEventListener("dragstart", handleExportDragStart);
  els.exportQueue.addEventListener("dragover", handleExportDragOver);
  els.exportQueue.addEventListener("drop", handleExportDrop);
  els.exportQueue.addEventListener("click", handleExportQueueClick);
  els.applyDesignButton.addEventListener("click", saveDesignSettings);
  els.resetDesignButton.addEventListener("click", resetDesignSettings);

  els.bookmarkBar.addEventListener("click", (event) => {
    const copyButton = event.target.closest("button[data-copy-bookmark]");
    if (copyButton) {
      copyBookmarkLink(copyButton.dataset.copyBookmark);
      return;
    }

    const link = event.target.closest("a[data-bookmark]");
    if (!link) return;
    event.preventDefault();
    jumpToBookmark(link.dataset.bookmark);
  });

  els.blockButton.addEventListener("click", () => { saveSelectionRange(); toggleBlockPanel(true); });
  els.closeBlockPanel.addEventListener("click", () => toggleBlockPanel(false));
  els.saveBlockButton.addEventListener("click", saveBlock);
  [els.blockBgInput, els.blockBorderInput, els.blockTextInput, els.blockHeadingInput, els.blockTextSizeInput].forEach((input) => {
    input?.addEventListener("input", updateSelectedTCardStyleFromPanel);
    input?.addEventListener("change", updateSelectedTCardStyleFromPanel);
  });
  els.insertBlockRefButton.addEventListener("click", insertBlockReference);
  els.deleteBlockButton?.addEventListener("click", toggleBlockDeleteMode);
  els.editBlockInlineButton?.addEventListener("click", toggleInlineTCardEditMode);
  els.blockList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("button[data-delete-block-id]");
    if (deleteButton) { confirmDeleteBlock(deleteButton.dataset.deleteBlockId); return; }
    const button = event.target.closest("button[data-block-id]");
    if (!button) return;
    selectBlock(button.dataset.blockId);
  });

  els.editor.addEventListener("click", handleEditorClick);
  els.editor.addEventListener("mouseover", handleEditorHover);
  els.editor.addEventListener("mouseout", handleEditorMouseOut);
  els.editor.addEventListener("dragstart", handleEditorDragStart);
  els.editor.addEventListener("dragover", handleEditorDragOver);
  els.editor.addEventListener("drop", handleEditorDrop);
  els.editor.addEventListener("contextmenu", openSelectionContextMenu);
  els.selectionMenu.addEventListener("click", handleSelectionMenuClick);
  els.dialogBox.addEventListener("submit", submitDialog);
  els.dialogCancelButton.addEventListener("click", cancelDialog);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#selectionMenu")) hideSelectionContextMenu();
  });

  window.addEventListener("hashchange", openFromRoute);
  window.addEventListener("popstate", openFromRoute);
  document.addEventListener("keydown", (event) => {
    const isModifier = event.metaKey || event.ctrlKey;
    if (isModifier && event.key.toLowerCase() === "s") {
      event.preventDefault();
      persistNow("Saved locally");
    }
  });
}

function createDocument(id = `doc-${Date.now()}`, title = "Untitled Document") {
  const doc = {
    id,
    title,
    tags: [],
    updatedAt: new Date().toISOString(),
    content: els.documentTemplate.innerHTML.trim(),
    diskPath: "",
    diskSavedAt: "",
    localDraftAt: "",
  };
  state.documents.unshift(doc);
  return doc;
}

function openDocument(id, bookmarkId = "") {
  void promptForLocalDiskMismatch(id);
  state.activeId = id;
  state.pendingBookmarkId = bookmarkId;
  renderAll();
  updateUrl(bookmarkId);
  if (bookmarkId) scrollToRouteBookmark();
  setStatus("Ready", "saved");
}

function openFromRoute() {
  const previousId = state.activeId;
  applyRouteToState();
  if (state.activeId !== previousId) renderAll();
  scrollToRouteBookmark();
}

function applyRouteToState() {
  const route = parseRoute();
  const routeDocument = route.documentId ? findDocumentByRouteId(route.documentId) : null;
  if (routeDocument) {
    state.activeId = routeDocument.id;
  } else if (route.documentId) {
    const doc = createDocument(route.documentId, humanizeDocumentId(route.documentId));
    state.activeId = doc.id;
    markDirty("Created document from URL");
  }
  state.pendingBookmarkId = route.bookmarkId;
}

function scrollToRouteBookmark() {
  if (!state.pendingBookmarkId) return;
  requestAnimationFrame(() => jumpToBookmark(state.pendingBookmarkId, false));
}

function activeDocument() {
  return state.documents.find((doc) => doc.id === state.activeId) ?? state.documents[0];
}

function renderAll() {
  renderDocumentSelect();
  renderActiveDocument();
  renderBookmarks();
  renderBlockList();
  renderExportSourceSelect();
  renderExportQueue();
  renderWritingRoomCards();
  renderDocumentEndBar();
  renderWritingAssistRail();
}


function renderDocumentEndBar() {
  if (!els.documentEndBar) return;
  const doc = activeDocument();
  const fileType = documentFileType(doc);
  els.documentEndBar.innerHTML = `
    <button type="button" data-end-action="writing-room" data-tool-name="Open the Writing Room Filing Cabinet">Writing Room</button>
    <span class="end-doc-title"><span class="card-icon">${docIcon(doc)}</span><strong>${escapeHtml(doc.title)}</strong></span>
    <span class="end-doc-meta">${escapeHtml(fileType)} · ${escapeHtml(doc.id)} · ${escapeHtml((doc.tags || []).join(", ") || "No tags")}</span>
    <span class="document-card-actions">
      <button type="button" data-end-action="open" data-tool-name="Open this file in the Writing Room panel">↗</button>
      <button type="button" data-end-action="bulk-style" data-tool-name="Bulk style TCards, tables, or emphasis boxes in this file">🎨</button>
      <button type="button" data-end-action="duplicate" data-tool-name="Duplicate this file">⧉</button>
      <button type="button" data-end-action="deprecate" data-tool-name="Deprecate this file as an old version">🕰</button>
      <button type="button" data-end-action="delete" data-tool-name="Move this file to Trash">❌</button>
      <button type="button" data-end-action="copy" data-tool-name="Copy this file URL">🔗</button>
    </span>`;
}

async function handleDocumentEndBarClick(event) {
  const button = event.target.closest("button[data-end-action]");
  if (!button) return;
  const doc = activeDocument();
  const action = button.dataset.endAction;
  if (action === "writing-room" || action === "open") return toggleWritingRoomPanel(true);
  if (action === "bulk-style") return bulkStyleDocument(doc.id);
  if (action === "duplicate") return duplicateDocument(doc.id);
  if (action === "deprecate") return deprecateDocument(doc.id);
  if (action === "delete") return deleteDocumentSafely(doc.id);
  if (action === "copy") {
    await copyText(new URL(documentUrl(doc.id), location.href).href);
    setStatus("Copied file link", "saved");
  }
}

function renderDocumentSelect() {
  els.documentSelect.innerHTML = state.documents.map((doc) => (
    `<option value="${escapeAttr(doc.id)}" ${doc.id === state.activeId ? "selected" : ""}>${escapeHtml(doc.title)}</option>`
  )).join("");
}

function renderActiveDocument() {
  const doc = activeDocument();
  els.titleInput.value = doc.title;
  els.tagsInput.value = (doc.tags ?? []).join(", ");
  state.suppressInput = true;
  els.editor.innerHTML = renderTransclusions(doc.content);
  ensureHeadingIds();
  state.suppressInput = false;
}

function renderBookmarks() {
  if (els.bookmarkBar) els.bookmarkBar.innerHTML = "";
}

function getBookmarks() {
  return [...els.editor.querySelectorAll("h1[id], h2[id], h3[id], [data-bookmark='true'][id]")].map((heading) => ({
    id: heading.id,
    label: heading.textContent.trim() || heading.id,
  }));
}

function ensureHeadingIds() {
  [...els.editor.querySelectorAll("h1, h2, h3")].forEach((heading) => {
    if (!heading.id) heading.id = uniqueBookmarkId(slugify(heading.textContent || "section"));
  });
  syncEditorToDocument(false);
  prepareEditorInteractiveBlocks();
}

function renderTransclusions(html) {
  return String(html ?? "").replace(/\{\{([A-Za-z]+-[A-Za-z0-9-]+)\}\}/g, (_, id) => {
    const block = state.blocks[id];
    const content = block ? block.content : "Missing TCard";
    const style = blockStyleAttr(block?.style);
    const isInlineEditing = state.inlineTCardEditId === id;
    const classes = `transclusion-ref${isInlineEditing ? " is-inline-editing" : ""}`;
    return `<aside class="${classes}" contenteditable="false" draggable="${isInlineEditing ? "false" : "true"}" data-block-id="${escapeAttr(id)}"${style}><button type="button" class="floating-edit-button tcard-edit-button" data-edit-tcard="${escapeAttr(id)}" title="${isInlineEditing ? "Finish editing TCard" : "Edit TCard"}">${isInlineEditing ? "✓" : "✎"}</button><span>${escapeHtml(id)}</span><div class="tcard-content" data-inline-tcard-content="${escapeAttr(id)}" contenteditable="${isInlineEditing ? "true" : "false"}" spellcheck="true">${sanitizeBlockContent(content)}</div></aside>`;
  });
}

function syncEditorToDocument(updateTimestamp = true) {
  const clone = els.editor.cloneNode(true);
  clone.querySelectorAll(".floating-edit-button").forEach((node) => node.remove());
  clone.querySelectorAll(".transclusion-ref[data-block-id]").forEach((node) => {
    node.replaceWith(document.createTextNode(`{{${node.dataset.blockId}}}`));
  });
  const doc = activeDocument();
  doc.content = clone.innerHTML;
  if (updateTimestamp) doc.updatedAt = new Date().toISOString();
}

function runCommand(command) {
  els.editor.focus();
  if (command === "cycleTextAlign") {
    cycleTextAlignment();
    return;
  }
  document.execCommand(command, false, null);
  syncAndSave("Formatting updated");
}

function cycleTextAlignment(targetNode = null) {
  const selection = window.getSelection();
  let node = targetNode || selection?.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const block = node?.closest?.("th, td, p, h1, h2, h3, li, aside") || currentEditableBlock();
  if (!block || !els.editor.contains(block)) return;
  const current = (block.style.textAlign || getComputedStyle(block).textAlign || "left").toLowerCase();
  const next = current.includes("center") ? "right" : current.includes("right") ? "left" : "center";
  block.style.textAlign = next;
  syncAndSave(`Alignment set to ${next}`);
}

function currentEditableBlock() {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  let node = selection.getRangeAt(0).commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return node?.closest?.("p, h1, h2, h3, li, th, td, aside") || null;
}

function formatBlock(tag) {
  els.editor.focus();
  document.execCommand("formatBlock", false, tag);
  ensureHeadingIds();
  renderBookmarks();
  syncAndSave("Heading updated");
}


function saveSelectionRange() {
  const selection = window.getSelection();
  if (selection.rangeCount && els.editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    state.savedRange = selection.getRangeAt(0).cloneRange();
  }
}

function restoreSelectionRange() {
  if (!state.savedRange) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(state.savedRange);
}

function selectedPlainText() {
  const selection = window.getSelection();
  return selection?.toString().trim() || "";
}

function openSelectionContextMenu(event) {
  const table = event.target.closest("table");
  if (table && els.editor.contains(table)) {
    event.preventDefault();
    showTableEditButton(table, true);
    return;
  }
  const pill = event.target.closest("a.pill-link");
  const selection = window.getSelection();
  if (pill) {
    event.preventDefault();
    const range = document.createRange();
    range.selectNodeContents(pill);
    selection.removeAllRanges();
    selection.addRange(range);
    saveSelectionRange();
    showSelectionContextMenu(event.clientX, event.clientY);
    return;
  }
  if (!selection.rangeCount || selection.isCollapsed || !els.editor.contains(selection.getRangeAt(0).commonAncestorContainer)) return;
  event.preventDefault();
  saveSelectionRange();
  showSelectionContextMenu(event.clientX, event.clientY);
}

function showSelectionContextMenu(clientX, clientY) {
  els.selectionMenu.hidden = false;
  const margin = 12;
  const rect = els.selectionMenu.getBoundingClientRect();
  const left = Math.min(clientX, window.innerWidth - rect.width - margin);
  const top = Math.min(clientY, window.innerHeight - rect.height - margin);
  els.selectionMenu.style.left = `${Math.max(margin, left)}px`;
  els.selectionMenu.style.top = `${Math.max(margin, top)}px`;
}

function hideSelectionContextMenu() {
  els.selectionMenu.hidden = true;
}

async function handleSelectionMenuClick(event) {
  const button = event.target.closest("button[data-context-action]");
  if (!button) return;
  hideSelectionContextMenu();
  restoreSelectionRange();
  const action = button.dataset.contextAction;
  if (action === "bookmark") await insertBookmark();
  if (action === "transclusion") await createTransclusionFromSelection();
  if (action === "link") await createHyperlink();
  if (action === "pill") await createPillLink();
  if (action === "edit-link") await editSelectedLink();
  if (action === "pill-color") await changeSelectedPillColor();
  if (action === "deprecate-paragraph") await deprecateSelectedParagraph();
}

function renderWritingAssistRail() {
  if (!els.writingAssistRail || !els.editor) return;
  const doc = activeDocument();
  const targets = [];

  els.editor.querySelectorAll(".transclusion-ref[data-block-id]").forEach((node) => {
    targets.push({ node, type: "tcard", icon: "𝞃", title: `TCard: ${node.dataset.blockId || "Transclusion Card"}` });
  });
  els.editor.querySelectorAll(".emphasis-box").forEach((node) => {
    targets.push({ node, type: "emphasis", icon: "ε", title: "Emphasis box" });
  });
  els.editor.querySelectorAll("a[href]").forEach((node) => {
    targets.push({ node, type: "link", icon: "🔗", title: `Link: ${node.getAttribute("href") || "reference"}` });
  });
  els.editor.querySelectorAll("[data-bookmark='true'][id]").forEach((node) => {
    targets.push({ node, type: "anchor", icon: "⚓", title: `Link Anchor: ${node.id}` });
  });
  (state.deprecatedParagraphs || [])
    .filter((item) => item.documentId === doc.id)
    .forEach((item) => {
      const node = elementForDeprecatedRecord(item);
      if (node) targets.push({ node, type: "deprecated", icon: "🕰️", title: `Deprecated paragraph saved ${formatDateTime(item.createdAt)}` });
    });

  els.writingAssistRail.classList.toggle("is-empty", !targets.length);
  els.writingAssistRail.innerHTML = "";
  targets.forEach((target, index) => {
    const marker = document.createElement("span");
    marker.className = "assist-rail-marker";
    marker.dataset.markerType = target.type;
    marker.dataset.assistTargetIndex = String(index);
    marker.title = target.title;
    marker.textContent = target.icon;
    marker._assistTarget = target.node;
    els.writingAssistRail.appendChild(marker);
  });
  updateWritingAssistRailPosition();
}

function elementForDeprecatedRecord(record) {
  if (!record?.approximateReference) return null;
  if (record.approximateReference.startsWith("#")) {
    try { return els.editor.querySelector(`#${CSS.escape(record.approximateReference.slice(1))}`); } catch { return null; }
  }
  const match = record.approximateReference.match(/^block-index:(\d+)$/);
  if (!match) return null;
  const candidates = Array.from(els.editor.querySelectorAll("p, li, td, th, blockquote, h1, h2, h3, h4, h5, h6, div, aside"));
  return candidates[Number(match[1])] || null;
}

function updateWritingAssistRailPosition() {
  if (!els.writingAssistRail || !els.editor) return;
  if (els.writingAssistRail.classList.contains("is-empty")) return;
  const shell = els.editorApp || document.querySelector(".writer-shell");
  const editorRect = els.editor.getBoundingClientRect();
  const shellRect = shell?.getBoundingClientRect?.() || { left: 0, top: 0 };
  const headerRect = document.querySelector(".writer-header")?.getBoundingClientRect?.();
  const left = Math.max(8, editorRect.left - shellRect.left - 40);
  const rawTop = editorRect.top - shellRect.top;
  const headerSafeTop = headerRect ? Math.max(rawTop, headerRect.bottom - shellRect.top + 8) : rawTop;
  els.writingAssistRail.style.setProperty("left", `${left}px`, "important");
  els.writingAssistRail.style.setProperty("top", `${Math.max(0, headerSafeTop)}px`, "important");
  els.writingAssistRail.style.setProperty("min-height", `${Math.max(120, els.editor.offsetHeight)}px`, "important");
  positionWritingAssistRailMarkers(editorRect, Number(els.writingAssistRail.style.top.replace("px", "")) || 0, rawTop);
}

function positionWritingAssistRailMarkers(editorRect, railTop, editorTopRelativeToShell) {
  if (!els.writingAssistRail) return;
  const railShift = railTop - Math.max(0, editorTopRelativeToShell);
  els.writingAssistRail.querySelectorAll(".assist-rail-marker").forEach((marker) => {
    const target = marker._assistTarget;
    if (!target || !document.body.contains(target)) {
      marker.hidden = true;
      return;
    }
    const rect = target.getBoundingClientRect();
    const top = rect.top - editorRect.top + rect.height / 2 - 11 - railShift;
    marker.style.top = `${Math.max(6, top)}px`;
  });
}

async function deprecateSelectedParagraph() {
  restoreSelectionRange();
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed || !els.editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    setStatus("Select paragraph text before using Deprecate Paragraph", "dirty");
    return;
  }
  const range = selection.getRangeAt(0).cloneRange();
  const originalHtml = selectedHtmlFromRange(range);
  const originalText = selection.toString().trim();
  const result = await openCapsDialog("Deprecate Paragraph", [
    { html: `<p><strong>Deprecate Paragraph will save a history copy of this selected text while leaving the live document unchanged.</strong></p><p>No text will be removed, replaced, moved, or turned into a separate deprecated document.</p><p><strong>Selected text preview:</strong><br>${escapeHtml(originalText).slice(0, 420)}${originalText.length > 420 ? "…" : ""}</p>` },
  ]);
  if (!result) return;
  const doc = activeDocument();
  const record = {
    id: `deprecated-paragraph-${Date.now()}`,
    documentId: doc.id,
    createdAt: new Date().toISOString(),
    originalHtml,
    originalText,
    nearbyHeading: nearbyHeadingForRange(range),
    note: "Placeholder paragraph history record. Comparison/restore view will be built later.",
    approximateReference: approximateSelectionReference(range),
  };
  state.deprecatedParagraphs = Array.isArray(state.deprecatedParagraphs) ? state.deprecatedParagraphs : [];
  state.deprecatedParagraphs.unshift(record);
  renderWritingAssistRail();
  markDirty("Deprecated paragraph history saved locally");
}

function selectedHtmlFromRange(range) {
  const container = document.createElement("div");
  container.appendChild(range.cloneContents());
  return container.innerHTML.trim();
}

function nearbyHeadingForRange(range) {
  const headings = Array.from(els.editor.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  let nearby = "";
  for (const heading of headings) {
    const headingRange = document.createRange();
    headingRange.selectNodeContents(heading);
    headingRange.collapse(false);
    try {
      if (range.compareBoundaryPoints(Range.START_TO_START, headingRange) >= 0) nearby = heading.textContent.trim();
    } catch {
      // Ignore detached/invalid ranges and keep the last safe heading.
    }
  }
  return nearby;
}

function approximateSelectionReference(range) {
  let node = range.startContainer;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const block = node?.closest?.("p, li, td, th, blockquote, h1, h2, h3, h4, h5, h6, div") || null;
  if (!block || !els.editor.contains(block)) return "";
  if (block.id) return `#${block.id}`;
  const candidates = Array.from(els.editor.querySelectorAll("p, li, td, th, blockquote, h1, h2, h3, h4, h5, h6, div"));
  const index = candidates.indexOf(block);
  return index >= 0 ? `block-index:${index}` : "";
}

async function createTransclusionFromSelection() {
  saveSelectionRange();
  const selectedText = selectedPlainText();
  const result = await openCapsDialog("Create TCard", [
    { name: "id", label: "TCard ID", value: "", placeholder: "Character-Name / Item-Name / Location-Name" },
    { name: "content", label: "TCard Content", value: selectedText, multiline: true },
  ]);
  if (!result?.id) return;
  const id = result.id.trim();
  if (!/^[A-Za-z]+-[A-Za-z0-9-]+$/.test(id)) {
    setStatus("Use TCard IDs like Item-Runestones", "dirty");
    return;
  }
  state.blocks[id] = { id, content: result.content || selectedText, updatedAt: new Date().toISOString() };
  restoreSelectionRange();
  insertHtml(`{{${escapeHtml(id)}}}`);
  renderBlockList();
  renderExportSourceSelect();
  setStatus("TCard created", "saved");
}

function openCapsDialog(title, fields) {
  els.dialogTitle.textContent = title;
  const normalizedTitle = title.toLowerCase();
  const isHighPriorityDialog = normalizedTitle.includes("upload") || normalizedTitle.includes("delete") || normalizedTitle.includes("use") || normalizedTitle.includes("not empty");
  els.dialogOverlay.classList.toggle("is-top-layer", isHighPriorityDialog);
  els.dialogBox.classList.toggle("delete-confirm-dialog", normalizedTitle.includes("delete") || normalizedTitle.includes("not empty"));
  els.dialogFields.innerHTML = fields.map(renderDialogField).join("");
  const footer = els.dialogBox.querySelector("footer");
  footer.querySelectorAll(".dialog-footer-field").forEach((item) => item.remove());
  els.dialogFields.querySelectorAll(".dialog-footer-field").forEach((item) => footer.insertBefore(item, els.dialogConfirmButton));
  els.dialogOverlay.hidden = false;
  els.dialogFields.querySelector("input:not([readonly]), textarea:not([readonly])")?.focus();
  return new Promise((resolve) => { state.dialogResolver = resolve; });
}

function renderDialogField(field) {
  if (field.html) {
    return `<div class="dialog-html-field ${field.compact ? "dialog-html-compact" : ""}">${field.html}</div>`;
  }
  if (field.checkbox) {
    return `<label class="dialog-check ${field.footer ? "dialog-footer-field" : ""}"><input type="checkbox" name="${escapeAttr(field.name)}"> ${escapeHtml(field.label)}</label>`;
  }
  if (field.options) {
    const options = field.options.map((option) => {
      const value = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;
      const selected = value === field.value ? " selected" : "";
      return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(label)}</option>`;
    }).join("");
    return `<label>${escapeHtml(field.label)}<select name="${escapeAttr(field.name)}">${options}</select></label>`;
  }
  const readonly = field.readonly ? " readonly" : "";
  return `
    <label>${escapeHtml(field.label)}
      ${field.multiline
        ? `<textarea name="${escapeAttr(field.name)}" rows="5" placeholder="${escapeAttr(field.placeholder || "")}"${readonly}>${escapeHtml(field.value || "")}</textarea>`
        : `<input name="${escapeAttr(field.name)}" value="${escapeAttr(field.value || "")}" placeholder="${escapeAttr(field.placeholder || "")}"${readonly}>`}
    </label>
  `;
}

function submitDialog(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.dialogBox).entries());
  closeCapsDialog(data);
}

function cancelDialog() {
  closeCapsDialog(null);
}

function closeCapsDialog(value) {
  els.dialogOverlay.hidden = true;
  els.dialogOverlay.classList.remove("is-top-layer");
  const resolve = state.dialogResolver;
  state.dialogResolver = null;
  if (resolve) resolve(value);
}

async function createHyperlink() {
  saveSelectionRange();
  const result = await openCapsDialog("Create Link", [{ name: "target", label: "Target", value: "", placeholder: "document id, #bookmark, block:Item-Name, {{Item-Name}}, or https://" }]);
  if (!result?.target) return;
  restoreSelectionRange();
  runLinkCommand(result.target, { pill: false });
}

async function createPillLink() {
  saveSelectionRange();
  const existingLink = currentLink();
  if (existingLink) {
    existingLink.classList.add("pill-link");
    existingLink.dataset.linkStyle = "pill";
    syncAndSave("Converted link to pill");
    return;
  }

  const result = await openCapsDialog("Create Link Pill", [{ name: "target", label: "Target", value: "", placeholder: "document id, #bookmark, block:Item-Name, {{Item-Name}}, or https://" }]);
  if (!result?.target) return;
  restoreSelectionRange();
  runLinkCommand(result.target, { pill: true });
}

async function changeSelectedPillColor() {
  const link = currentLink();
  if (!link?.classList.contains("pill-link")) {
    setStatus("Right-click a Link Pill to recolor it", "dirty");
    return;
  }
  const result = await openCapsDialog("Link Pill Color", [
    { name: "bg", label: "Pill background", value: link.style.backgroundColor || CAPSANOTO_PALETTE.deepPlum, placeholder: "#28133f" },
    { name: "text", label: "Pill text", value: link.style.color || CAPSANOTO_PALETTE.parchment, placeholder: "#fbf4d6" },
  ]);
  if (!result) return;
  if (result.bg) link.style.backgroundColor = normalizeHexColor(result.bg) || result.bg;
  if (result.text) link.style.color = normalizeHexColor(result.text) || result.text;
  syncAndSave("Link Pill color updated");
}

async function editSelectedLink() {
  saveSelectionRange();
  const link = currentLink();
  if (!link) {
    setStatus("Select a link to edit", "dirty");
    return;
  }
  const currentTarget = link.dataset.linkTarget || link.getAttribute("href") || "";
  const result = await openCapsDialog("Edit Link", [{ name: "target", label: "Target", value: currentTarget }]);
  if (!result?.target) return;
  applyLinkTarget(link, result.target, link.classList.contains("pill-link"));
  syncAndSave("Link updated");
}

function removeSelectedLink() {
  const link = currentLink();
  if (!link) {
    setStatus("Select a link to remove", "dirty");
    return;
  }
  link.replaceWith(document.createTextNode(link.textContent));
  syncAndSave("Link removed");
}

function runLinkCommand(target, options = {}) {
  const normalized = normalizeLinkTarget(target);
  els.editor.focus();
  document.execCommand("createLink", false, normalized.href);
  const matchingLinks = [...els.editor.querySelectorAll(`a[href="${cssString(normalized.href)}"]`)];
  const link = currentLink() || matchingLinks[matchingLinks.length - 1];
  if (link) applyLinkMetadata(link, normalized, options.pill);
  syncAndSave(options.pill ? "Link Pill created" : "Link created");
}

function applyLinkTarget(link, target, keepPill = false) {
  applyLinkMetadata(link, normalizeLinkTarget(target), keepPill);
}

function applyLinkMetadata(link, normalized, pill = false) {
  link.href = normalized.href;
  link.dataset.linkType = normalized.type;
  link.dataset.linkTarget = normalized.target;
  link.dataset.previewType = normalized.type;
  link.dataset.previewTarget = normalized.target;
  link.title = normalized.label;
  link.classList.toggle("pill-link", Boolean(pill));
  if (pill) link.dataset.linkStyle = "pill";
  else delete link.dataset.linkStyle;
}

function currentLink() {
  const selection = window.getSelection();
  if (selection.rangeCount) {
    let node = selection.anchorNode;
    while (node && node !== els.editor) {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches("a")) return node;
      node = node.parentNode;
    }
    const selectedElement = selection.getRangeAt(0).commonAncestorContainer;
    if (selectedElement.nodeType === Node.ELEMENT_NODE) {
      const nestedLink = selectedElement.closest?.("a") || selectedElement.querySelector?.("a");
      if (nestedLink) return nestedLink;
    }
  }
  return document.activeElement?.closest?.("a") || null;
}

function handleEditorClick(event) {
  const cell = event.target.closest("th, td");
  if (cell && els.editor.contains(cell)) { state.activeTableCell = cell; highlightActiveTableCell(cell.closest("table")); }
  const tcardButton = event.target.closest("[data-edit-tcard]");
  if (tcardButton) {
    const id = tcardButton.dataset.editTcard;
    toggleBlockPanel(true);
    selectBlock(id);
    if (state.inlineTCardEditId === id) commitInlineTCardEdit(id);
    return;
  }
  const tableButton = event.target.closest(".table-edit-button");
  if (tableButton) return;
  hideSelectionContextMenu();
  handleEditorLinkClick(event);
}

function handleEditorLinkClick(event) {
  const link = event.target.closest("a[data-link-type='block']");
  if (!link) return;
  event.preventDefault();
  toggleBlockPanel(true);
  selectBlock(link.dataset.linkTarget);
  setStatus(`Opened block ${link.dataset.linkTarget}`, "saved");
}

function handleEditorLinkPreview(event) {
  const link = event.target.closest("a[data-preview-type]");
  if (!link) return;
  const preview = getLinkPreviewData(link);
  if (preview) link.title = preview.summary;
}

function getLinkPreviewData(link) {
  const type = link.dataset.previewType;
  const target = link.dataset.previewTarget;
  if (type === "document") {
    const doc = findDocumentByRouteId(target);
    return doc ? { type, title: doc.title, summary: `Document: ${doc.title}` } : null;
  }
  if (type === "bookmark") return { type, title: target, summary: `Bookmark: ${target}` };
  if (type === "block") {
    const block = state.blocks[target];
    return block ? { type, title: block.id, summary: `Block: ${block.id} — ${block.content.slice(0, 120)}` } : null;
  }
  return null;
}

async function insertBookmark() {
  saveSelectionRange();
  const selectedText = selectedPlainText();
  const result = await openCapsDialog("Create Bookmark", [{ name: "label", label: "Heading / Bookmark name", value: selectedText }]);
  if (!result?.label) return;
  restoreSelectionRange();
  const id = uniqueBookmarkId(slugify(result.label));
  insertHtml(`<h2 id="${escapeAttr(id)}" data-bookmark="true">${escapeHtml(result.label)}</h2><p></p>`);
  updateUrl(id);
}

function jumpToBookmark(id, updateHash = true) {
  const target = els.editor.querySelector(`#${CSS.escape(id)}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (updateHash) updateUrl(id);
}

async function openDocumentSettings() {
  const doc = activeDocument();
  const result = await openCapsDialog("Document Settings", [
    { name: "title", label: "Document title", value: doc.title },
    { name: "tags", label: "Tags", value: (doc.tags ?? []).join(", "), placeholder: "character, episode, lore" },
  ]);
  if (!result) return;
  doc.title = result.title?.trim() || "Untitled Document";
  doc.tags = String(result.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
  els.titleInput.value = doc.title;
  els.tagsInput.value = doc.tags.join(", ");
  renderDocumentSelect();
  renderWritingRoomCards();
  updateUrl();
  markDirty("Document settings updated");
}

function insertEmphasisBox() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !els.editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    insertHtml('<aside class="emphasis-box" draggable="true"><p>Emphasis note</p></aside>');
    return;
  }
  const selectedHtml = selection.isCollapsed ? "Emphasis note" : selectionHtml(selection.getRangeAt(0));
  insertHtml(`<aside class="emphasis-box" draggable="true">${selectedHtml}</aside><p></p>`);
}

function selectionHtml(range) {
  const fragment = range.cloneContents();
  const wrapper = document.createElement("div");
  wrapper.append(fragment);
  return wrapper.innerHTML || escapeHtml(range.toString());
}

function insertTable() {
  insertHtml(`<table class="editable-table" draggable="true"><thead><tr><th>Field</th><th>Notes</th></tr></thead><tbody><tr><td>Canon</td><td></td></tr><tr><td>Reference</td><td></td></tr></tbody></table><p></p>`);
}

function embedSelectedImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    insertHtml(`<figure><img src="${reader.result}" alt="Embedded lore image"><figcaption>Image note</figcaption></figure>`);
    els.imageInput.value = "";
  });
  reader.readAsDataURL(file);
}


const DEFAULT_FAVORITE_EMOJIS = ["⭐","✨","🔥","💎","🗝️","📜","🗡️","💜","🧙","🏰","🌙","☀️","💧","🌲","🧪","🪄","⚔️","🛡️","📖","📝","🎬","🎵","🎤","🎨","🖼️","🔗","⚓","💊","🧩","🔍","⚙️","❓","✅","❌","➕","➖"];

const EMOJI_LIBRARY = [
  ["😀","grin smile happy face smiley"],["😃","smile happy face smiley"],["😄","laugh happy face smiley"],["😁","grin smiley"],["😆","laugh smiley"],["😅","sweat smile smiley"],["😂","tears laugh smiley"],["🤣","rolling laugh smiley"],["😊","blush smile smiley"],["🙂","slight smile smiley"],["🙃","upside down smile smiley"],["😉","wink smiley"],["😍","heart eyes love smiley"],["🥰","hearts love affectionate smiley"],["😘","kiss smiley"],["😗","kiss face smiley"],["😚","closed eye kiss smiley"],["😋","yum tasty smiley"],["😜","tongue wink silly smiley"],["🤪","zany crazy smiley"],["😝","tongue squint smiley"],["🤑","money face"],["🤗","hug smiley"],["🤭","hand mouth giggle"],["🫢","hand mouth shocked"],["🤫","shush quiet"],["🤔","thinking"],["🫡","salute"],["🤐","zip mouth"],["🤨","raised eyebrow"],["😐","neutral"],["😑","expressionless"],["😶","no mouth silent"],["😏","smirk"],["😒","unamused"],["🙄","eyeroll"],["😬","grimace"],["😮‍💨","exhale sigh"],["🤥","lying"],["😌","relieved"],["😔","sad pensive"],["😪","sleepy"],["🤤","drool"],["😴","sleep"],["😷","mask sick"],["🤒","thermometer sick"],["🤕","bandage hurt"],["🤢","nausea sick"],["🤮","vomit sick"],["🤧","sneeze sick"],["🥵","hot"],["🥶","cold freeze"],["🥴","woozy drunk"],["😵","dizzy"],["🤯","mind blown"],["🤠","cowboy"],["🥳","party"],["🥸","disguise"],["😎","cool sunglasses"],["🤓","nerd"],["🧐","monocle"],["😕","confused"],["🫤","diagonal mouth"],["😟","worried"],["🙁","frown"],["☹️","frown sad"],["😮","surprise"],["😯","hushed"],["😲","astonished"],["😳","flushed"],["🥺","pleading"],["🥹","holding tears"],["😦","frown open"],["😧","anguished"],["😨","fear"],["😰","cold sweat"],["😥","sad sweat"],["😢","cry"],["😭","sob"],["😱","scream fear"],["😖","confounded"],["😣","persevere"],["😞","disappointed"],["😓","sweat"],["😩","weary"],["😫","tired"],["🥱","yawn"],["😤","triumph steam"],["😡","angry"],["😠","mad angry"],["🤬","swear angry"],["😈","devil"],["👿","angry devil"],["👻","ghost"],["💀","skull death"],["☠️","skull crossbones death"],["🤡","clown"],["🤖","robot"],["👽","alien"],["👑","crown royal"],["🧑","person character"],["👤","profile person"],["🧙","wizard magic"],["🧝","elf fantasy"],["🧛","vampire"],["🐺","wolf"],["🐉","dragon"],["🦅","eagle"],["🕊️","dove peace"],["🔥","fire"],["💧","water"],["🌊","wave ocean"],["🌲","tree forest"],["🌙","moon"],["☀️","sun"],["⭐","star favorite"],["✨","sparkle magic"],["⚡","lightning"],["❄️","snow ice"],["🌫️","fog mist"],["🌹","rose flower"],["🍃","leaf"],["🏰","castle"],["⛪","church"],["🏠","house home"],["🗺️","map"],["🧭","compass"],["🛤️","road track"],["⚔️","sword battle"],["🛡️","shield"],["🏹","bow arrow"],["🗡️","dagger sword"],["🔫","gun"],["💣","bomb"],["🪄","wand spell"],["🧪","potion science"],["💎","gem crystal"],["🗝️","key"],["🔒","lock"],["🔓","unlock"],["📜","scroll parchment"],["📖","book"],["📕","red book"],["📝","note writing"],["✏️","pencil edit"],["🖋️","pen"],["📁","folder"],["📂","open folder"],["📄","file document"],["🗃️","file cabinet"],["🗑️","trash"],["🎬","movie scene script"],["🎵","music song"],["🎤","voice mic"],["🎧","headphones"],["🎨","paint color"],["🖼️","image picture"],["🔗","link chain"],["⚓","anchor bookmark"],["💊","pill"],["🧩","puzzle subnoto"],["🔍","search find"],["⚙️","settings gear"],["❓","question help"],["❗","warning"],["✅","check yes"],["❌","x delete no"],["➕","plus add"],["➖","minus remove"],["⬆️","up"],["⬇️","down"],["⬅️","left"],["➡️","right"],["↗️","open external"],["♻️","restore recycle"],["🕰️","old deprecated time"],["💗","heart love"],["❤️","heart red"],["🖤","black heart"],["💜","purple heart"]
];

function favoriteEmojiList() {
  if (!state.favoriteEmojis.length) loadFavoriteEmojis();
  return state.favoriteEmojis.length ? state.favoriteEmojis : [...DEFAULT_FAVORITE_EMOJIS];
}

function loadFavoriteEmojis() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITE_EMOJI_KEY) || "null");
    state.favoriteEmojis = Array.isArray(saved) ? saved.filter(Boolean).slice(0, 36) : [...DEFAULT_FAVORITE_EMOJIS];
  } catch {
    state.favoriteEmojis = [...DEFAULT_FAVORITE_EMOJIS];
  }
}

function loadFavoriteEmojiSettings() {
  loadFavoriteEmojis();
  if (els.favoriteEmojiInput) els.favoriteEmojiInput.value = favoriteEmojiList().join(" ");
}

function saveFavoriteEmojisFromSettings() {
  const values = Array.from((els.favoriteEmojiInput?.value || "").matchAll(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*|[\u2600-\u27BF]\uFE0F?/gu)).map((match) => match[0]);
  state.favoriteEmojis = values.length ? values.slice(0, 36) : [...DEFAULT_FAVORITE_EMOJIS];
  localStorage.setItem(FAVORITE_EMOJI_KEY, JSON.stringify(state.favoriteEmojis));
  loadFavoriteEmojiSettings();
  setStatus("Favorite emojis saved", "saved");
}

function emojiButtonHtml(emoji, name = "favorite emoji") {
  return `<button type="button" data-emoji="${escapeAttr(emoji)}" data-emoji-name="${escapeAttr(name)}" title="${escapeAttr(name)}">${escapeHtml(emoji)}</button>`;
}

function customIconCode(slot) {
  return `{{icon:custom-${slot + 1}}}`;
}

function customIconSlotFromCode(value) {
  const match = String(value || "").trim().match(/^\{\{icon:custom-(\d+)\}\}$/i);
  if (!match) return -1;
  const slot = Number(match[1]) - 1;
  return Number.isInteger(slot) && slot >= 0 && slot < 12 ? slot : -1;
}

function loadCustomEmojis() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_EMOJI_KEY) || "null");
    state.customEmojis = Array.isArray(saved) ? saved.slice(0, 12).map((value) => String(value || "")) : [];
  } catch {
    state.customEmojis = [];
  }
  while (state.customEmojis.length < 12) state.customEmojis.push("");
}

function saveCustomEmojis() {
  localStorage.setItem(CUSTOM_EMOJI_KEY, JSON.stringify(state.customEmojis.slice(0, 12)));
}

function customIconUrlForCode(value) {
  if (!state.customEmojis.length) loadCustomEmojis();
  const slot = customIconSlotFromCode(value);
  return slot >= 0 ? state.customEmojis[slot] || "" : "";
}

function iconMarkupFromValue(value, fallback = "") {
  const raw = String(value || fallback || "").trim();
  const url = customIconUrlForCode(raw);
  if (url) return `<img class="custom-inline-icon" src="${escapeAttr(url)}" alt="${escapeAttr(raw)}">`;
  return escapeHtml(raw || fallback);
}

function customEmojiButtonHtml(url, index) {
  const code = customIconCode(index);
  if (!url) {
    return `<button type="button" class="custom-emoji-slot is-empty" data-custom-slot="${index}" data-emoji="${escapeAttr(code)}" data-emoji-name="empty custom icon slot" title="Empty custom icon slot">＋</button>`;
  }
  return `<button type="button" class="custom-emoji-slot" data-custom-slot="${index}" data-custom-icon="true" data-emoji="${escapeAttr(code)}" data-emoji-name="custom icon ${index + 1}" title="Custom icon ${index + 1}: ${escapeAttr(code)}"><img src="${escapeAttr(url)}" alt="${escapeAttr(code)}"></button>`;
}

async function uploadCustomEmoji(picker) {
  loadCustomEmojis();
  const firstEmpty = state.customEmojis.findIndex((value) => !value);
  const targetSlot = firstEmpty >= 0 ? firstEmpty : 0;
  const result = await openCapsDialog("Upload Custom Emoji/Icon URL", [
    { name: "url", label: "Image / icon URL", value: "", placeholder: "https://example.com/icon.png" },
  ]);
  const url = result?.url?.trim();
  if (!url) return;
  state.customEmojis[targetSlot] = url;
  saveCustomEmojis();
  refreshEmojiPicker(picker);
  setContextStatus(`Custom icon saved as ${customIconCode(targetSlot)}`, "saved");
}

function refreshEmojiPicker(picker) {
  if (!picker) return;
  const customGrid = picker.querySelector(".emoji-custom .emoji-grid");
  if (customGrid) customGrid.innerHTML = state.customEmojis.slice(0, 12).map(customEmojiButtonHtml).join("");
}

function showEmojiPicker(event) {
  saveSelectionRange();
  document.querySelector(".emoji-picker")?.remove();
  loadFavoriteEmojis();
  loadCustomEmojis();
  const picker = document.createElement("div");
  picker.className = "emoji-picker";
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-label", "Emoji Spark");
  const favoriteButtons = favoriteEmojiList().map((emoji) => emojiButtonHtml(emoji, "favorite emoji")).join("");
  const customButtons = state.customEmojis.slice(0, 12).map(customEmojiButtonHtml).join("");
  const libraryButtons = EMOJI_LIBRARY.map(([emoji, name]) => emojiButtonHtml(emoji, name)).join("");
  picker.innerHTML = `
    <div class="emoji-picker-header"><strong>Emoji Spark</strong><button type="button" class="emoji-close" aria-label="Close emoji picker">×</button></div>
    <div class="emoji-search-row"><button type="button" class="emoji-copy" aria-label="Copy selected emoji">Copy</button><button type="button" class="emoji-upload" aria-label="Upload custom emoji URL">Upload</button><button type="button" class="emoji-clear" aria-label="Clear emoji search">Clear</button><input class="emoji-search" type="search" placeholder="Search: smiley, sword, magic…" aria-label="Search emoji"></div>
    <section class="emoji-section emoji-favorites"><h4>Favorites</h4><div class="emoji-grid">${favoriteButtons}</div></section>
    <section class="emoji-section emoji-custom"><h4>Custom</h4><div class="emoji-grid">${customButtons}</div></section>
    <section class="emoji-section emoji-library"><h4>Library</h4><div class="emoji-grid">${libraryButtons}</div></section>`;
  const copyMode = event?.currentTarget?.id === "settingsEmojiLibraryButton";
  let selectedEmoji = "";
  const selectEmoji = (button, { copyCustom = false } = {}) => {
    picker.querySelectorAll("button[data-emoji]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    selectedEmoji = button.dataset.emoji || "";
    picker.dataset.selectedEmoji = selectedEmoji;
    setContextStatus(`Selected ${button.dataset.customIcon ? "custom icon code" : "emoji"} ${selectedEmoji}`, "saved");
    if (button.dataset.customIcon && copyCustom) copySelectedEmoji();
  };
  const copySelectedEmoji = () => {
    if (!selectedEmoji) {
      const first = picker.querySelector("button[data-emoji]:not([hidden]):not(.is-empty)") || picker.querySelector("button[data-emoji]:not([hidden])");
      if (first) selectEmoji(first);
    }
    if (!selectedEmoji) return;
    navigator.clipboard?.writeText(selectedEmoji).catch(() => {});
    setContextStatus(`Copied ${selectedEmoji}. Paste it into a settings field.`, "saved");
  };
  picker.addEventListener("contextmenu", (contextEvent) => {
    const button = contextEvent.target.closest("button[data-emoji]");
    if (!button || button.classList.contains("is-empty")) return;
    contextEvent.preventDefault();
    selectEmoji(button);
    copySelectedEmoji();
  });
  picker.addEventListener("click", async (clickEvent) => {
    if (clickEvent.target.closest(".emoji-close")) {
      picker.remove();
      return;
    }
    if (clickEvent.target.closest(".emoji-copy")) {
      copySelectedEmoji();
      return;
    }
    if (clickEvent.target.closest(".emoji-clear")) {
      const search = picker.querySelector(".emoji-search");
      search.value = "";
      filterEmojiPicker(picker, "");
      search.focus();
      return;
    }
    if (clickEvent.target.closest(".emoji-upload")) {
      await uploadCustomEmoji(picker);
      return;
    }
    const button = clickEvent.target.closest("button[data-emoji]");
    if (!button) return;
    if (button.classList.contains("is-empty")) {
      await uploadCustomEmoji(picker);
      return;
    }
    selectEmoji(button, { copyCustom: true });
    if (copyMode || button.dataset.customIcon) return;
    restoreSelectionRange();
    insertHtml(selectedEmoji);
  });
  const search = picker.querySelector(".emoji-search");
  search.addEventListener("input", () => filterEmojiPicker(picker, search.value));
  search.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.key !== "Enter") return;
    keyEvent.preventDefault();
    const match = picker.querySelector(".emoji-library button[data-emoji]:not([hidden])") || picker.querySelector("button[data-emoji]:not([hidden]):not(.is-empty)");
    if (match) {
      selectEmoji(match);
      if (copyMode || match.dataset.customIcon) copySelectedEmoji();
      else {
        restoreSelectionRange();
        insertHtml(selectedEmoji);
      }
    }
  });
  const header = picker.querySelector(".emoji-picker-header");
  header.addEventListener("pointerdown", (dragEvent) => startEmojiPickerDrag(dragEvent, picker));
  document.body.append(picker);
  const rect = event.currentTarget.getBoundingClientRect();
  picker.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 720))}px`;
  picker.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 720)}px`;
  const firstFavorite = picker.querySelector(".emoji-favorites button[data-emoji]");
  if (firstFavorite) selectEmoji(firstFavorite);
  search.focus();
}

function filterEmojiPicker(picker, value) {
  const term = String(value || "").trim().toLowerCase();
  picker.querySelectorAll(".emoji-library button[data-emoji]").forEach((button) => {
    const haystack = `${button.dataset.emojiName || ""} ${button.dataset.emoji || ""}`.toLowerCase();
    button.hidden = Boolean(term) && !haystack.includes(term);
  });
}

function startEmojiPickerDrag(event, picker) {
  if (event.target.closest("button, input")) return;
  const rect = picker.getBoundingClientRect();
  state.emojiDrag = { picker, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  picker.querySelector(".emoji-picker-header")?.setPointerCapture?.(event.pointerId);
}

document.addEventListener("pointermove", (event) => {
  if (!state.emojiDrag?.picker) return;
  const { picker, offsetX, offsetY } = state.emojiDrag;
  picker.style.left = `${Math.max(8, Math.min(window.innerWidth - 80, event.clientX - offsetX))}px`;
  picker.style.top = `${Math.max(8, Math.min(window.innerHeight - 80, event.clientY - offsetY))}px`;
});

document.addEventListener("pointerup", () => { state.emojiDrag = null; });
window.addEventListener("scroll", () => {
  const toolbar = document.querySelector(".table-edit-toolbar");
  if (toolbar && state.activeTable) positionTableEditToolbar(toolbar, state.activeTable);
}, true);
window.addEventListener("resize", () => {
  const toolbar = document.querySelector(".table-edit-toolbar");
  if (toolbar && state.activeTable) positionTableEditToolbar(toolbar, state.activeTable);
});

function closeEmojiPickerOnOutside(event) {
  // Emoji Spark now stays open until the X button is clicked.
}

function insertHtml(html) {
  els.editor.focus();
  document.execCommand("insertHTML", false, html);
  ensureHeadingIds();
  renderBookmarks();
  syncAndSave("Content inserted");
}

function handleGlobalSettingsCloseClick(event) {
  const closeButton = event.target?.closest?.("#closeSettingsPanel");
  if (!closeButton) return;
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  closeSettingsPanelNow();
}

function closeSettingsPanelNow({ force = false } = {}) {
  state.panelDrag = null;
  if (!els.settingsPanel) return;
  if (!force && state.settingsDirty && !confirm("You have unsaved settings changes. Are you sure you want to close without saving?")) return;
  state.settingsDirty = false;
  els.settingsPanel.hidden = true;
  els.settingsPanel.setAttribute("hidden", "");
  els.settingsButton?.setAttribute("aria-expanded", "false");
}

function markSettingsDirtyFromEvent(event) {
  if (!els.settingsPanel || !els.settingsPanel.contains(event.target)) return;
  if (event.target.closest("#settingsSearchInput")) return;
  state.settingsDirty = true;
}

function saveSettingsAndClose() {
  saveDesignSettings();
  saveFavoriteEmojisFromSettings();
  state.settingsDirty = false;
  closeSettingsPanelNow({ force: true });
}

function toggleSettingsPanel(show) {
  if (!els.settingsPanel) return;
  if (!show) {
    closeSettingsPanelNow();
    return;
  }
  els.settingsPanel.hidden = false;
  els.settingsPanel.removeAttribute("hidden");
  els.settingsButton?.setAttribute("aria-expanded", "true");
  renderExportSourceSelect();
  renderExportQueue();
  loadDesignForm();
  loadFavoriteEmojiSettings();
  loadCustomEmojis();
  refreshIconInputPreviews();
  setElementDesignerCards(false);
  showSettingsSection("design");
  state.settingsDirty = false;
}

function handleSettingsMenuClick(event) {
  const button = event.target.closest("button[data-settings-tab]");
  if (!button) return;
  showSettingsSection(button.dataset.settingsTab);
}

function handleSettingsCardToggle(event) {
  // Settings cards are controlled by the top settings tab buttons.
  // Keep this intentionally empty so clicking a displayed card title does not hide its contents.
}


function showSettingsSection(sectionName) {
  els.settingsMenu.querySelectorAll("button[data-settings-tab]").forEach((button) => {
    const isActiveButton = button.dataset.settingsTab === sectionName;
    button.setAttribute("aria-pressed", String(isActiveButton));
  });
  els.settingsSections.forEach((section) => {
    const isActive = section.dataset.settingsSection === sectionName;
    section.hidden = !isActive;
    section.classList.toggle("is-active-settings-card", isActive);
  });
  const active = [...els.settingsSections].find((section) => section.dataset.settingsSection === sectionName);
  if (active && els.settingsPanel) {
    requestAnimationFrame(() => {
      active.scrollTop = 0;
      els.settingsPanel.scrollTop = 0;
    });
  }
}

function openFilingCabinetSettingsMode() {
  toggleWritingRoomPanel(true);
  if (!state.filingEditMode) toggleFilingEditMode();
  setContextStatus("Filing Cabinet settings: click Settings on a folder, tab, or document");
}

function toggleWritingRoomPanel(show = els.writingRoomPanel.hidden) {
  els.writingRoomPanel.hidden = !show;
  els.writingRoomButton.setAttribute("aria-expanded", String(show));
  if (show) { applyWritingRoomPanelLayout(); renderWritingRoomCards(); }
}

function toggleFilingEditMode() {
  state.filingEditMode = !state.filingEditMode;
  els.editWritingRoomButton.setAttribute("aria-pressed", String(state.filingEditMode));
  if (els.saveWritingRoomLayoutButton) els.saveWritingRoomLayoutButton.hidden = !state.filingEditMode;
  els.writingRoomEditBar.hidden = !state.filingEditMode;
  els.writingRoomPanel.classList.toggle("is-editing", state.filingEditMode);
  els.writingRoomTitle.contentEditable = String(state.filingEditMode);
  els.writingRoomTitle.classList.toggle("is-inline-editable", state.filingEditMode);
  if (!state.filingEditMode) { state.writingRoomName = els.writingRoomTitle.textContent.trim() || "Writing Room"; markDirty("Writing Room renamed"); }
  renderWritingRoomCards();
  setContextStatus(state.filingEditMode ? "Filing Cabinet edit mode unlocked" : "Filing Cabinet locked");
}

async function createFilingGroup(type) {
  const result = await openCapsDialog(type === "folder" ? "New Folder" : "New Tab", [
    { name: "name", label: `${type === "folder" ? "Folder" : "Tab"} name`, value: "" },
  ]);
  const name = result?.name?.trim();
  if (!name) return;
  state.filingGroups.push({ id: `${type}-${slugify(name)}-${Date.now()}`, label: name, type, createdAt: new Date().toISOString() });
  renderWritingRoomCards();
  markDirty(`${type === "folder" ? "Folder" : "Tab"} added`);
}

async function createFilingTab() {
  const groupId = activeFilingGroupId();
  const result = await openCapsDialog("New Tab", [
    { name: "title", label: "Tab name", value: "New Tab" },
  ]);
  const title = result?.title?.trim() || "New Tab";
  state.filingTabs.push({
    id: `tab-${slugify(title)}-${Date.now()}`,
    label: title,
    groupId,
    type: "tab",
    createdAt: new Date().toISOString(),
  });
  renderWritingRoomCards();
  markDirty("Filing Cabinet tab added");
}

function defaultFilingGroups() {
  return [
    { id: "writing-room-tabs", label: "Writing Room Tabs", type: "folder" },
    { id: "writing-room-core", label: "Writing Room Core", type: "folder" },
    { id: "episodes", label: "Episodes", type: "folder" },
    { id: "characters", label: "Characters", type: "folder" },
  ];
}

function normalizeFilingHierarchy() {
  state.filingGroups = Array.isArray(state.filingGroups) && state.filingGroups.length ? state.filingGroups : defaultFilingGroups();
  state.filingGroups = state.filingGroups.map((group, index) => ({
    id: group.id || `folder-${index + 1}`,
    label: group.label || group.name || `Folder ${index + 1}`,
    type: group.type || "folder",
    locked: Boolean(group.locked),
    createdAt: group.createdAt || "",
    order: Number.isFinite(Number(group.order)) ? Number(group.order) : index,
  }));
  ensureFilingTabs();
  state.filingTabs = state.filingTabs.map((tab, index) => ({
    id: tab.id || `tab-${index + 1}`,
    label: tab.label || tab.name || `Tab ${index + 1}`,
    groupId: state.filingGroups.some((group) => group.id === tab.groupId) ? tab.groupId : state.filingGroups[0].id,
    type: tab.type || "tab",
    locked: Boolean(tab.locked),
    createdAt: tab.createdAt || "",
    order: Number.isFinite(Number(tab.order)) ? Number(tab.order) : index,
  }));
  const tabIds = new Set(state.filingTabs.map((tab) => tab.id));
  state.documents.forEach((doc, index) => {
    if (!doc.filingTabId || !tabIds.has(doc.filingTabId)) {
      const groupId = doc.filingGroupId && state.filingGroups.some((group) => group.id === doc.filingGroupId) ? doc.filingGroupId : groupIdForDocument(doc);
      let tab = state.filingTabs.find((item) => item.groupId === groupId);
      if (!tab) {
        const group = state.filingGroups.find((item) => item.id === groupId) || state.filingGroups[0];
        tab = createDefaultTabForGroup(group);
        state.filingTabs.push(tab);
      }
      doc.filingTabId = tab.id;
      doc.filingGroupId = tab.groupId;
    } else {
      const tab = state.filingTabs.find((item) => item.id === doc.filingTabId);
      doc.filingGroupId = tab?.groupId || doc.filingGroupId || state.filingGroups[0].id;
    }
    doc.order = Number.isFinite(Number(doc.order)) ? Number(doc.order) : index;
  });
}

function ensureFilingTabs() {
  state.filingGroups.forEach((group) => {
    if (!state.filingTabs.some((tab) => tab.groupId === group.id)) {
      state.filingTabs.push(createDefaultTabForGroup(group));
    }
  });
  state.documents.forEach((doc) => {
    if (doc.filingTabId && state.filingTabs.some((tab) => tab.id === doc.filingTabId)) return;
    const groupId = doc.filingGroupId || groupIdForDocument(doc);
    let tab = state.filingTabs.find((item) => item.groupId === groupId);
    if (!tab) {
      const group = state.filingGroups.find((item) => item.id === groupId) || state.filingGroups[0];
      tab = createDefaultTabForGroup(group);
      state.filingTabs.push(tab);
    }
    doc.filingGroupId = tab.groupId;
    doc.filingTabId = tab.id;
  });
}

function createDefaultTabForGroup(group) {
  return {
    id: `tab-${group.id}-main`,
    label: "Tab number 1",
    groupId: group.id,
    type: "tab",
    createdAt: new Date().toISOString(),
  };
}

function activeFilingGroupId() {
  const active = activeDocument();
  if (active?.filingGroupId && state.filingGroups.some((group) => group.id === active.filingGroupId)) return active.filingGroupId;
  if (active?.filingTabId) {
    const tab = state.filingTabs.find((item) => item.id === active.filingTabId);
    if (tab?.groupId) return tab.groupId;
  }
  return state.filingGroups[0]?.id || defaultFilingGroups()[0].id;
}

function renderWritingRoomCards() {
  if (!els.writingRoomCards) return;
  ensureFilingTabs();
  els.writingRoomTitle.textContent = state.writingRoomName || "Writing Room";
  const groups = filingCabinetTree();
  const groupHtml = groups.map((group, groupIndex) => `
    <details class="writing-room-group" data-group-id="${escapeAttr(group.id)}" ${groupIndex === 0 || group.locked ? "open" : ""}>
      <summary><span class="card-arrow">›</span><span class="folder-icon">${groupIcon(group)}</span><strong ${inlineEditAttrs("group", group.id, "label")}>${escapeHtml(group.label)}</strong><button type="button" class="lock-button" title="Keep folder expanded" data-group-action="lock" data-group-id="${escapeAttr(group.id)}">${group.locked ? "🔒" : "🔓"}</button>${state.filingEditMode ? `<span class="filing-group-actions"><button type="button" title="Delete folder" aria-label="Delete folder" data-group-action="delete" data-group-id="${escapeAttr(group.id)}">❌</button></span>` : ""}</summary>
      <div class="writing-room-card-stack folder-tab-stack" data-drop-group="${escapeAttr(group.id)}">
        ${group.tabs.map((tab) => renderFilingTab(tab)).join("")}
        ${state.filingEditMode && !group.tabs.length ? '<p class="panel-help">Create a tab in this folder before adding documents.</p>' : ''}
      </div>
    </details>
  `).join("");
  const rail = `<nav class="filing-jump-rail" aria-label="Filing Cabinet jumps"><button type="button" data-filing-action="collapse-all" title="Collapse all">−</button>${groups.map((group) => `<button type="button" data-scroll-group="${escapeAttr(group.id)}" title="${escapeAttr(group.label)}"><span>${groupIcon(group)}</span></button>`).join("")}<button type="button" data-filing-action="expand-all" title="Expand all">＋</button></nav>`;
  const trashHtml = renderTrashSection();
  els.writingRoomCards.innerHTML = rail + groupHtml + trashHtml;
}

function inlineEditAttrs(kind, id, field) {
  return state.filingEditMode ? `contenteditable="true" spellcheck="false" data-inline-kind="${kind}" data-inline-id="${escapeAttr(id)}" data-inline-field="${field}" class="inline-editable"` : "";
}

function renderFilingTab(tab) {
  return `<details class="filing-tab" data-tab-id="${escapeAttr(tab.id)}" draggable="${state.filingEditMode}" ${tab.locked ? "open" : ""}>
    <summary><span class="card-arrow">›</span><span class="tab-icon">${designIconSetting("tabIconText", "▱")}</span><strong ${inlineEditAttrs("tab", tab.id, "label")}>${escapeHtml(tab.label)}</strong><button type="button" class="lock-button" title="Keep tab expanded" data-tab-action="lock" data-tab-id="${escapeAttr(tab.id)}">${tab.locked ? "🔒" : "🔓"}</button>${state.filingEditMode ? `<span class="filing-group-actions"><button type="button" title="Delete tab" aria-label="Delete tab" data-tab-action="delete" data-tab-id="${escapeAttr(tab.id)}">❌</button></span>` : ""}</summary>
    <div class="writing-room-card-stack filing-tab-documents" data-drop-tab="${escapeAttr(tab.id)}">
      ${tab.documents.map((doc) => renderWritingRoomCard(doc, 0)).join("")}
      ${state.filingEditMode && !tab.documents.length ? '<p class="panel-help">Drop documents into this tab.</p>' : ''}
    </div>
  </details>`;
}

function renderWritingRoomCard(doc, depth = 0) {
  const tags = (doc.tags ?? []).slice(0, 8);
  const updated = doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "Not saved yet";
  const preview = textFromHtml(renderTransclusions(doc.content)).slice(0, 180) || "Empty Writing Room tab";
  const fileType = documentFileType(doc);
  return `<details class="writing-room-card ${doc.id === state.activeId ? "is-active" : ""}" draggable="${state.filingEditMode}" style="--tab-depth:${depth}" data-doc-card="${escapeAttr(doc.id)}">
    <summary>
      <span class="card-arrow">›</span>
      <span class="card-icon" title="${escapeAttr(fileType)}">${docIcon(doc)}</span>
      <strong ${inlineEditAttrs("doc", doc.id, "title")}>${escapeHtml(doc.title)}</strong>
    </summary>
    <div class="writing-room-card-body">
      <span class="document-card-actions">
        <button type="button" title="Open" data-card-action="open" data-doc-id="${escapeAttr(doc.id)}">↗</button>
        <button type="button" title="Edit all TCards, tables, or emphasis boxes" data-card-action="bulk-style" data-doc-id="${escapeAttr(doc.id)}">🎨</button>
        <button type="button" title="Duplicate" data-card-action="duplicate" data-doc-id="${escapeAttr(doc.id)}">⧉</button>
        <button type="button" title="Deprecate old version" data-card-action="deprecate" data-doc-id="${escapeAttr(doc.id)}">🕰</button>
        <button type="button" title="Delete" data-card-action="delete" data-doc-id="${escapeAttr(doc.id)}">❌</button>
        <button type="button" title="Copy URL" data-card-action="copy" data-doc-id="${escapeAttr(doc.id)}">🔗</button>
      </span>
      <details class="metadata-pill"><summary>Meta data</summary><div class="metadata-pill-body">
        <p>Type: <span ${inlineEditAttrs("doc", doc.id, "type")}>${escapeHtml(fileType)}</span></p>
        <p>ID: <span ${inlineEditAttrs("doc", doc.id, "id")}>${escapeHtml(doc.id)}</span></p>
        <p>Tags: <span ${inlineEditAttrs("doc", doc.id, "tags")}>${escapeHtml(tags.join(", ") || "No tags")}</span></p>
        <p>Updated ${escapeHtml(updated)}</p>
      </div></details>
      <p>${escapeHtml(preview)}</p>
      ${renderDeprecatedVersions(doc)}
    </div>
  </details>`;
}

function renderTrashSection() {
  const deleted = state.trash.map((doc) => archivedCard(doc, "trash")).join("") || '<p class="panel-help">Trash is empty.</p>';
  return `<details class="writing-room-group filing-archive"><summary><span class="card-arrow">›</span><strong>Trashcan</strong></summary><div class="writing-room-card-stack">${deleted}</div></details>`;
}

function archivedCard(doc, source) {
  return `<article class="writing-room-card archived-card"><div class="writing-room-card-body"><strong>${escapeHtml(doc.title)}</strong><p class="doc-id-line"><strong>Document ID:</strong> ${escapeHtml(doc.id)}</p><span class="document-card-actions"><button type="button" data-card-action="restore" data-archive-source="${source}" data-doc-id="${escapeAttr(doc.id)}">Restore</button></span></div></article>`;
}

function filingCabinetTree() {
  const groups = state.filingGroups.length ? state.filingGroups : defaultFilingGroups();
  const groupsById = new Map(groups.map((group) => [group.id, { ...group, tabs: [] }]));
  state.filingTabs.forEach((tab) => {
    const group = groupsById.get(tab.groupId) || groupsById.values().next().value;
    if (!group) return;
    if (!groupsById.has(tab.groupId)) tab.groupId = group.id;
    group.tabs.push({ ...tab, documents: [] });
  });
  const tabsById = new Map([...groupsById.values()].flatMap((group) => group.tabs.map((tab) => [tab.id, tab])));
  state.documents.forEach((doc) => {
    const tab = resolveDocumentTab(doc, groupsById, tabsById);
    tab.documents.push(doc);
  });
  return [...groupsById.values()];
}

function resolveDocumentTab(doc, groupsById, tabsById) {
  let tab = doc.filingTabId ? tabsById.get(doc.filingTabId) : null;
  if (tab) {
    doc.filingGroupId = tab.groupId;
    return tab;
  }
  const groupId = doc.filingGroupId && groupsById.has(doc.filingGroupId) ? doc.filingGroupId : groupIdForDocument(doc);
  const group = groupsById.get(groupId) || groupsById.values().next().value;
  let fallbackTab = group.tabs[0];
  if (!fallbackTab) {
    fallbackTab = createDefaultTabForGroup(group);
    group.tabs.push({ ...fallbackTab, documents: [] });
    tabsById.set(fallbackTab.id, group.tabs[group.tabs.length - 1]);
  }
  doc.filingGroupId = group.id;
  doc.filingTabId = fallbackTab.id;
  return tabsById.get(fallbackTab.id) || group.tabs[group.tabs.length - 1];
}

function groupIdForDocument(doc) {
  const label = writingRoomGroupLabel(doc);
  return state.filingGroups.find((group) => group.label === label)?.id || state.filingGroups[0]?.id || defaultFilingGroups()[0].id;
}

function writingRoomGroupLabel(doc) {
  const tags = (doc.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.includes("character")) return "Characters";
  if (tags.includes("episode") || tags.includes("season-1")) return "Episodes";
  if (tags.includes("worldbuilding")) return "Writing Room Core";
  return "Writing Room Tabs";
}

function designIconSetting(key, fallback) {
  try {
    const settings = JSON.parse(localStorage.getItem(DESIGN_KEY) || "{}");
    return iconMarkupFromValue(settings[key] || fallback, fallback);
  } catch {
    return iconMarkupFromValue(fallback, fallback);
  }
}

function groupIcon(group) {
  const label = String(group.label || "").toLowerCase();
  if (label.includes("character")) return designIconSetting("charactersIconText", "🧑");
  if (label.includes("episode")) return designIconSetting("episodesIconText", "🎬");
  if (label.includes("core") || label.includes("world")) return designIconSetting("coreIconText", "💗");
  return group.icon ? iconMarkupFromValue(group.icon, "📁") : designIconSetting("folderIconText", "📁");
}

function documentFileType(doc) {
  const tags = (doc.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.includes("script") || tags.includes("episode")) return "Script";
  if (tags.includes("character")) return "Character";
  if (tags.includes("worldbuilding")) return "Lore";
  if (tags.includes("outline")) return "Outline";
  return "Doc";
}

function docIcon(doc) {
  const type = documentFileType(doc);
  if (type === "Script") return designIconSetting("episodesIconText", "🎬");
  if (type === "Character") return designIconSetting("charactersIconText", "🧑");
  if (type === "Lore") return designIconSetting("coreIconText", "💗");
  if (type === "Outline") return "▤";
  return designIconSetting("documentIconText", "📄");
}

function renderDeprecatedVersions(doc) {
  const versions = state.deprecated.filter((entry) => entry.deprecatedOf === doc.id || (!entry.deprecatedOf && entry.title === doc.title));
  if (!versions.length) return "";
  return `<details class="deprecated-version-list"><summary>Deprecated versions</summary>${versions.map((entry) => archivedCard(entry, "deprecated")).join("")}</details>`;
}

async function handleWritingRoomCardClick(event) {
  const filingAction = event.target.closest("button[data-filing-action]");
  if (filingAction) {
    event.preventDefault();
    const open = filingAction.dataset.filingAction === "expand-all";
    els.writingRoomCards.querySelectorAll(".writing-room-group, .filing-tab").forEach((item) => { item.open = open; });
    return;
  }
  const railButton = event.target.closest("button[data-scroll-group]");
  if (railButton) {
    event.preventDefault();
    const group = els.writingRoomCards.querySelector(`[data-group-id="${CSS.escape(railButton.dataset.scrollGroup)}"]`);
    if (group) group.open = true;
    group?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const groupButton = event.target.closest("button[data-group-action]");
  if (groupButton) {
    event.preventDefault();
    return handleFilingGroupAction(groupButton.dataset.groupAction, groupButton.dataset.groupId);
  }
  const tabButton = event.target.closest("button[data-tab-action]");
  if (tabButton) {
    event.preventDefault();
    return handleFilingTabAction(tabButton.dataset.tabAction, tabButton.dataset.tabId);
  }
  const button = event.target.closest("button[data-card-action]");
  if (!button) return;
  const docId = button.dataset.docId;
  const action = button.dataset.cardAction;
  if (action === "open") { openDocument(docId); renderWritingRoomCards(); return; }
  if (action === "duplicate") return duplicateDocument(docId);
  if (action === "deprecate") return deprecateDocument(docId);
  if (action === "delete") return deleteDocumentSafely(docId);
  if (action === "restore") return restoreArchivedDocument(docId, button.dataset.archiveSource);
  if (action === "bulk-style") return bulkStyleDocument(docId);
  if (action === "copy") {
    await copyText(new URL(documentUrl(docId), location.href).href);
    setStatus("Copied Writing Room tab link", "saved");
  }
}

async function handleFilingTabAction(action, tabId) {
  const tab = state.filingTabs.find((item) => item.id === tabId);
  if (!tab) return;
  const tabDocs = state.documents.filter((doc) => doc.filingTabId === tabId);
  if (action === "lock") {
    tab.locked = !tab.locked;
    renderWritingRoomCards();
    markDirty("Tab lock updated");
    return;
  }
  if (action === "settings") {
    const result = await openCapsDialog("Tab Settings", [
      { name: "label", label: "Tab label", value: tab.label },
    ]);
    const label = result?.label?.trim();
    if (!label) return;
    tab.label = label;
    renderWritingRoomCards();
    markDirty("Filing Cabinet tab settings updated");
    return;
  }
  if (action === "delete") {
    const confirmed = await confirmFilingDelete({ type: "tab", label: tab.label, docs: tabDocs });
    if (!confirmed) return;
    moveDocumentsToTrash(tabDocs);
    state.filingTabs = state.filingTabs.filter((item) => item.id !== tabId);
    renderAll();
    markDirty(tabDocs.length ? "Filing Cabinet tab and contents moved to Trash" : "Empty Filing Cabinet tab deleted");
  }
}

async function handleFilingGroupAction(action, groupId) {
  const group = state.filingGroups.find((item) => item.id === groupId) || filingCabinetTree().find((item) => item.id === groupId);
  if (!group) return;
  const groupTabs = state.filingTabs.filter((tab) => tab.groupId === groupId);
  const groupDocs = state.documents.filter((doc) => doc.filingGroupId === groupId || groupTabs.some((tab) => tab.id === doc.filingTabId));
  if (action === "lock") {
    const storedGroup = state.filingGroups.find((item) => item.id === groupId);
    if (storedGroup) storedGroup.locked = !storedGroup.locked;
    else state.filingGroups.push({ id: group.id, label: group.label, type: group.type || "folder", locked: true });
    renderWritingRoomCards();
    markDirty("Folder lock updated");
    return;
  }
  if (action === "settings") {
    const result = await openCapsDialog("Folder Settings", [
      { name: "label", label: "Folder label", value: group.label },
      { name: "type", label: "Type metadata", value: group.type || "folder", placeholder: "folder or tab" },
    ]);
    const label = result?.label?.trim();
    if (!label) return;
    const storedGroup = state.filingGroups.find((item) => item.id === groupId);
    if (storedGroup) {
      storedGroup.label = label;
      storedGroup.type = result.type?.trim() || storedGroup.type || "folder";
    } else {
      state.filingGroups.push({ id: group.id, label, type: result.type?.trim() || "folder" });
    }
    renderWritingRoomCards();
    markDirty("Filing Cabinet folder settings updated");
    return;
  }
  if (action === "delete") {
    const confirmed = await confirmFilingDelete({ type: "folder", label: group.label, tabs: groupTabs, docs: groupDocs });
    if (!confirmed) return;
    moveDocumentsToTrash(groupDocs);
    const tabIds = new Set(groupTabs.map((tab) => tab.id));
    state.filingTabs = state.filingTabs.filter((item) => item.groupId !== groupId);
    state.documents.filter((doc) => tabIds.has(doc.filingTabId)).forEach((doc) => moveDocumentsToTrash([doc]));
    state.filingGroups = state.filingGroups.filter((item) => item.id !== groupId);
    renderAll();
    markDirty((groupTabs.length || groupDocs.length) ? "Filing Cabinet folder and contents moved to Trash" : "Empty Filing Cabinet folder deleted");
  }
}

function duplicateDocument(docId) {
  const doc = state.documents.find((item) => item.id === docId);
  if (!doc) return;
  const copy = JSON.parse(JSON.stringify(doc));
  copy.id = uniqueDocumentId(`${doc.id}-copy`);
  copy.title = `${doc.title} Copy`;
  copy.updatedAt = new Date().toISOString();
  state.documents.splice(state.documents.indexOf(doc) + 1, 0, copy);
  renderAll();
  markDirty("Document duplicated");
}

function deprecateDocument(docId) {
  const index = state.documents.findIndex((item) => item.id === docId);
  if (index < 0) return;
  const oldDoc = JSON.parse(JSON.stringify(state.documents[index]));
  oldDoc.id = uniqueDocumentId(`${oldDoc.id}-deprecated`);
  oldDoc.deprecatedAt = new Date().toISOString();
  oldDoc.deprecatedOf = state.documents[index].id;
  oldDoc.title = `${oldDoc.title} (Old Version)`;
  state.deprecated.push(oldDoc);
  state.documents[index].updatedAt = new Date().toISOString();
  renderAll();
  markDirty("Old version deprecated");
}

function documentTextStats(html) {
  const withBreaks = String(html || "")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|aside)>/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n");
  const text = textFromHtml(withBreaks).trim();
  return {
    characters: text.length,
    lines: text.split(/\n|\r/).filter((line) => line.trim()).length || (text ? 1 : 0),
  };
}

async function deleteDocumentSafely(docId) {
  const index = state.documents.findIndex((item) => item.id === docId);
  if (index < 0) return;
  const doc = state.documents[index];
  const stats = documentTextStats(doc.content || "");
  const confirmed = await confirmFilingDelete({ type: "document", label: doc.title, docs: [doc], stats });
  if (!confirmed) return;
  moveDocumentsToTrash([doc]);
  if (state.activeId === docId) state.activeId = state.documents[0]?.id || createDocument().id;
  renderAll();
  markDirty("Document moved to Trash");
}

function moveDocumentsToTrash(docs) {
  const ids = new Set(docs.map((doc) => doc.id));
  const moving = state.documents.filter((doc) => ids.has(doc.id));
  state.documents = state.documents.filter((doc) => !ids.has(doc.id));
  moving.forEach((doc) => {
    doc.deletedAt = new Date().toISOString();
    state.trash.push(doc);
  });
}

async function confirmFilingDelete({ type, label, tabs = [], docs = [], stats = null }) {
  const hasContent = tabs.length || docs.length || (stats && stats.characters);
  const fields = [];
  if (hasContent) {
    fields.push({ html: `<p class="delete-warning-text">This section is not empty. You are about to delete:</p>${deleteTreeHtml({ type, label, tabs, docs, stats })}` });
  } else {
    fields.push({ html: `<p class="delete-warning-text">Delete empty ${escapeHtml(type)} <strong>${escapeHtml(label)}</strong>?</p>`, compact: true });
  }
  fields.push({ name: "confirm", label: "I still want to delete this.", checkbox: true, footer: true });
  const result = await openCapsDialog("Confirm Delete", fields);
  return result?.confirm === "on";
}

function deleteTreeHtml({ type, label, tabs = [], docs = [], stats = null }) {
  const rows = [];
  rows.push(`<li><span class="tree-type">${escapeHtml(type)}</span> ${escapeHtml(label)}</li>`);
  if (tabs.length) {
    rows.push(`<li><span class="tree-type">tabs</span><ul>${tabs.map((tab) => `<li>▱ ${escapeHtml(tab.label)}</li>`).join("")}</ul></li>`);
  }
  if (docs.length) {
    rows.push(`<li><span class="tree-type">documents</span><ul>${docs.map((doc) => {
      const docStats = documentTextStats(doc.content || "");
      return `<li>📄 ${escapeHtml(doc.title)} <small>${docStats.lines} lines · ${docStats.characters} chars</small></li>`;
    }).join("")}</ul></li>`);
  } else if (stats?.characters) {
    rows.push(`<li><span class="tree-type">content</span> ${stats.lines} lines · ${stats.characters} characters</li>`);
  }
  return `<div class="delete-tree-box"><ul>${rows.join("")}</ul></div>`;
}

function restoreArchivedDocument(docId, source) {
  const collection = source === "deprecated" ? state.deprecated : state.trash;
  const index = collection.findIndex((item) => item.id === docId);
  if (index < 0) return;
  const [doc] = collection.splice(index, 1);
  delete doc.deletedAt;
  delete doc.deprecatedAt;
  doc.id = uniqueDocumentId(doc.id);
  state.documents.push(doc);
  renderAll();
  markDirty("Document restored");
}

function uniqueDocumentId(base) {
  let id = slugify(base);
  let index = 2;
  while (state.documents.some((doc) => doc.id === id) || state.trash.some((doc) => doc.id === id) || state.deprecated.some((doc) => doc.id === id)) {
    id = `${slugify(base)}-${index}`;
    index += 1;
  }
  return id;
}

function handleFilingInlineKeydown(event) {
  if (!event.target.matches("[data-inline-kind]")) return;
  if (event.key === "Enter") {
    event.preventDefault();
    event.target.blur();
  }
}

function handleFilingInlineEdit(event) {
  const target = event.target.closest("[data-inline-kind]");
  if (!target || !state.filingEditMode) return;
  const value = target.textContent.trim();
  const { inlineKind: kind, inlineId: id, inlineField: field } = target.dataset;
  if (kind === "group") {
    const group = state.filingGroups.find((item) => item.id === id);
    if (group && value) group[field] = cleanInlinePrefix(value);
  } else if (kind === "tab") {
    const tab = state.filingTabs.find((item) => item.id === id);
    if (tab && value) tab[field] = cleanInlinePrefix(value);
  } else if (kind === "doc") {
    updateDocumentInlineField(id, field, value);
  }
  renderDocumentSelect();
  markDirty("Filing Cabinet metadata updated");
}

function updateDocumentInlineField(docId, field, value) {
  const doc = state.documents.find((item) => item.id === docId);
  if (!doc) return;
  if (field === "title" && value) doc.title = value;
  if (field === "tags") doc.tags = value === "No tags" ? [] : value.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (field === "type" && value) {
    const tags = new Set((doc.tags ?? []).filter((tag) => !["script", "doc", "lore", "outline", "character"].includes(tag.toLowerCase())));
    tags.add(value.toLowerCase());
    doc.tags = [...tags];
  }
  if (field === "id" && value && !state.documents.some((item) => item.id === value && item !== doc)) doc.id = slugify(value);
  doc.updatedAt = new Date().toISOString();
}

function cleanInlinePrefix(value) {
  return value.replace(/^▽\s*/, "").trim();
}

function handleFilingDragStart(event) {
  if (!state.filingEditMode) return;
  const card = event.target.closest("[data-doc-card]");
  if (card) {
    state.draggedDocId = card.dataset.docCard;
    state.draggedTabId = "";
    event.dataTransfer?.setData("text/plain", state.draggedDocId);
    return;
  }
  const tab = event.target.closest("[data-tab-id]");
  if (!tab) return;
  state.draggedTabId = tab.dataset.tabId;
  state.draggedDocId = "";
  event.dataTransfer?.setData("text/plain", state.draggedTabId);
}

function handleFilingDragOver(event) {
  if (state.filingEditMode && event.target.closest("[data-doc-card], [data-drop-group], [data-drop-tab], [data-tab-id]")) event.preventDefault();
}

function handleFilingDrop(event) {
  if (!state.filingEditMode || (!state.draggedDocId && !state.draggedTabId)) return;
  if (state.draggedTabId) return handleFilingTabDrop(event);
  const targetCard = event.target.closest("[data-doc-card]");
  const targetGroup = event.target.closest("[data-drop-group]");
  const targetTab = event.target.closest("[data-drop-tab]");
  if (!targetCard && !targetGroup && !targetTab) return;
  if (targetCard?.dataset.docCard === state.draggedDocId) return;
  event.preventDefault();
  const from = state.documents.findIndex((doc) => doc.id === state.draggedDocId);
  if (from < 0) return;
  const [doc] = state.documents.splice(from, 1);
  if (targetGroup) {
    doc.filingGroupId = targetGroup.dataset.dropGroup;
    const groupTab = state.filingTabs.find((tab) => tab.groupId === doc.filingGroupId);
    if (groupTab) doc.filingTabId = groupTab.id;
  }
  if (targetTab) {
    const tab = state.filingTabs.find((item) => item.id === targetTab.dataset.dropTab);
    if (tab) {
      doc.filingTabId = tab.id;
      doc.filingGroupId = tab.groupId;
    }
  }
  if (targetCard) {
    const targetDoc = state.documents.find((item) => item.id === targetCard.dataset.docCard);
    if (targetDoc?.filingGroupId) doc.filingGroupId = targetDoc.filingGroupId;
    if (targetDoc?.filingTabId) doc.filingTabId = targetDoc.filingTabId;
    const to = state.documents.findIndex((item) => item.id === targetCard.dataset.docCard);
    state.documents.splice(Math.max(0, to), 0, doc);
  } else {
    state.documents.push(doc);
  }
  state.draggedDocId = "";
  renderWritingRoomCards();
  markDirty("Filing Cabinet order updated");
}

function handleFilingTabDrop(event) {
  const targetGroup = event.target.closest("[data-drop-group]");
  const targetTab = event.target.closest("[data-tab-id]");
  if (!targetGroup && !targetTab) return;
  if (targetTab?.dataset.tabId === state.draggedTabId) return;
  event.preventDefault();
  const from = state.filingTabs.findIndex((tab) => tab.id === state.draggedTabId);
  if (from < 0) return;
  const [tab] = state.filingTabs.splice(from, 1);
  if (targetTab) {
    const target = state.filingTabs.find((item) => item.id === targetTab.dataset.tabId);
    if (target?.groupId) tab.groupId = target.groupId;
    const to = state.filingTabs.findIndex((item) => item.id === targetTab.dataset.tabId);
    state.filingTabs.splice(Math.max(0, to), 0, tab);
  } else if (targetGroup) {
    tab.groupId = targetGroup.dataset.dropGroup;
    state.filingTabs.push(tab);
  }
  state.documents.forEach((doc) => { if (doc.filingTabId === tab.id) doc.filingGroupId = tab.groupId; });
  state.draggedTabId = "";
  renderWritingRoomCards();
  markDirty("Filing Cabinet tab moved");
}

function startWritingRoomDrag(event) {
  if (event.target.closest("button, input, select, textarea")) return;
  const rect = els.writingRoomPanel.getBoundingClientRect();
  state.writingRoomDrag = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  els.writingRoomPanelHeader.setPointerCapture?.(event.pointerId);
}

function moveWritingRoomPanel(event) {
  if (!state.writingRoomDrag) return;
  const { offsetX, offsetY } = state.writingRoomDrag;
  els.writingRoomPanel.style.left = `${Math.max(8, Math.min(window.innerWidth - els.writingRoomPanel.offsetWidth - 8, event.clientX - offsetX))}px`;
  els.writingRoomPanel.style.top = `${Math.max(8, Math.min(window.innerHeight - 80, event.clientY - offsetY))}px`;
  els.writingRoomPanel.style.right = "auto";
}

function stopWritingRoomDrag(event) {
  if (state.writingRoomDrag) els.writingRoomPanelHeader.releasePointerCapture?.(event.pointerId);
  state.writingRoomDrag = null;
}

function startPanelDrag(event, panel) {
  if (event.target.closest("button, input, select, textarea")) return;
  const rect = panel.getBoundingClientRect();
  state.panelDrag = { panel, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
}

function movePanelDrag(event) {
  if (!state.panelDrag) return;
  const { panel, offsetX, offsetY } = state.panelDrag;
  panel.style.left = `${Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, event.clientX - offsetX))}px`;
  panel.style.top = `${Math.max(8, Math.min(window.innerHeight - 80, event.clientY - offsetY))}px`;
  panel.style.right = "auto";
}

function stopPanelDrag() { state.panelDrag = null; }


function openSubnotoWindow() {
  setContextStatus("Subnoto window placeholder ready", "saved");
  openCapsDialog("Subnoto", [
    { name: "note", label: "Subnoto will be defined in the next phase.", value: "", readonly: true },
  ]);
}

function startCabinetScrollDrag(event) {
  if (event.target.closest("button, input, select, textarea, summary, [contenteditable='true']")) return;
  state.cabinetScrollDrag = {
    y: event.clientY,
    scrollTop: els.writingRoomCards.scrollTop,
  };
  els.writingRoomCards.classList.add("is-drag-scrolling");
}

function moveCabinetScrollDrag(event) {
  if (!state.cabinetScrollDrag) return;
  event.preventDefault();
  const delta = event.clientY - state.cabinetScrollDrag.y;
  els.writingRoomCards.scrollTop = state.cabinetScrollDrag.scrollTop - delta;
}

function stopCabinetScrollDrag() {
  state.cabinetScrollDrag = null;
  els.writingRoomCards?.classList.remove("is-drag-scrolling");
}

function saveWritingRoomPanelLayout() {
  const rect = els.writingRoomPanel.getBoundingClientRect();
  const layout = {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  localStorage.setItem(WRITING_ROOM_LAYOUT_KEY, JSON.stringify(layout));
  setStatus("Writing Room layout saved", "saved");
  if (state.filingEditMode) toggleFilingEditMode();
}

function applyWritingRoomPanelLayout() {
  try {
    const layout = JSON.parse(localStorage.getItem(WRITING_ROOM_LAYOUT_KEY) || "null");
    if (!layout) return;
    if (layout.width) els.writingRoomPanel.style.width = `${Math.max(220, Math.min(window.innerWidth - 24, layout.width))}px`;
    if (layout.height) els.writingRoomPanel.style.height = `${Math.max(220, Math.min(window.innerHeight - 24, layout.height))}px`;
    if (Number.isFinite(layout.left)) els.writingRoomPanel.style.left = `${Math.max(8, Math.min(window.innerWidth - 80, layout.left))}px`;
    if (Number.isFinite(layout.top)) els.writingRoomPanel.style.top = `${Math.max(8, Math.min(window.innerHeight - 80, layout.top))}px`;
    els.writingRoomPanel.style.right = "auto";
  } catch (error) {
    console.warn("Ignoring unreadable Writing Room panel layout", error);
    localStorage.removeItem(WRITING_ROOM_LAYOUT_KEY);
  }
}

function blockStyleAttr(style = {}) {
  const css = [];
  if (style.bg) css.push(`--tcard-bg:${cssString(style.bg)}`);
  if (style.border) css.push(`--tcard-border:${cssString(style.border)}`);
  if (style.text) css.push(`--tcard-text:${cssString(style.text)}`);
  if (style.heading) css.push(`--tcard-heading:${cssString(style.heading)}`);
  if (style.size) css.push(`--tcard-size:${parseInt(style.size, 10) || 14}px`);
  return css.length ? ` style="${css.join(";")}"` : "";
}

function prepareEditorInteractiveBlocks() {
  els.editor.querySelectorAll("table").forEach((table) => {
    table.classList.add("editable-table");
    table.setAttribute("draggable", "true");
  });
  els.editor.querySelectorAll(".emphasis-box").forEach((node) => node.setAttribute("draggable", "true"));
  els.editor.querySelectorAll(".transclusion-ref").forEach((node) => {
    node.setAttribute("draggable", node.classList.contains("is-inline-editing") ? "false" : "true");
  });
}

function handleEditorHover(event) {
  handleEditorLinkPreview(event);
  const table = event.target.closest("table");
  clearTimeout(state.tableEditTimer);
  if (table && els.editor.contains(table)) {
    state.tableEditTimer = setTimeout(() => showTableEditButton(table), 1000);
  }
}

function handleEditorMouseOut(event) {
  if (!event.relatedTarget?.closest?.(".table-edit-toolbar") && !event.relatedTarget?.closest?.("table")) {
    clearTimeout(state.tableEditTimer);
    const toolbar = document.querySelector(".table-edit-toolbar:not(.is-open)");
    toolbar?.remove();
  }
}

function showTableEditButton(table, open = false) {
  const existing = document.querySelector(".table-edit-toolbar");
  if (existing && state.activeTable === table) {
    if (open) existing.classList.add("is-open");
    positionTableEditToolbar(existing, table);
    return;
  }
  removeFloatingEditorButtons(".table-edit-toolbar");
  state.activeTable = table;
  const toolbar = document.createElement("span");
  toolbar.className = "table-edit-toolbar is-floating";
  toolbar.dataset.tableToolsFor = table.dataset.tableId || (table.dataset.tableId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  if (open) toolbar.classList.add("is-open");
  toolbar.innerHTML = `<button type="button" class="table-edit-button" data-table-tool="toggle" title="Edit table">✎</button><span class="table-tool-row"><button type="button" data-table-tool="equalize" title="Equalise column widths">⇔</button><button type="button" data-table-tool="wider" title="Widen selected column">↔</button><button type="button" data-table-tool="add-row" title="Add row below selected cell">＋R</button><button type="button" data-table-tool="add-col" title="Add column right of selected cell">＋C</button><button type="button" data-table-tool="delete-row" title="Delete selected row">−R</button><button type="button" data-table-tool="delete-col" title="Delete selected column">−C</button><button type="button" data-table-tool="align" title="Cycle selected cell text alignment">≡</button><input type="color" data-table-tool="header-bg" title="Header/title background" value="#28133f"><input type="color" data-table-tool="cell-bg" title="Selected cell background" value="#211812"><input type="color" data-table-tool="line" title="Inner line color" value="#563485"><input type="color" data-table-tool="outer-border" title="Outer table border" value="#e88f69"></span>`;
  toolbar.addEventListener("click", (event) => handleTableToolAction(event, table, toolbar));
  toolbar.addEventListener("input", (event) => handleTableToolAction(event, table, toolbar));
  toolbar.addEventListener("mouseleave", () => {
    if (!toolbar.classList.contains("is-open") && !table.matches(":hover")) toolbar.remove();
  });
  document.body.append(toolbar);
  positionTableEditToolbar(toolbar, table);
}

function positionTableEditToolbar(toolbar, table) {
  if (!toolbar || !table?.isConnected) return;
  const rect = table.getBoundingClientRect();
  const width = toolbar.offsetWidth || 44;
  const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width - 8));
  const top = Math.max(8, Math.min(window.innerHeight - 44, rect.top + 8));
  toolbar.style.left = `${left}px`;
  toolbar.style.top = `${top}px`;
}

function highlightActiveTableCell(table) {
  table.querySelectorAll("th, td").forEach((cell) => cell.classList.remove("is-active-table-cell"));
  if (state.activeTableCell && table.contains(state.activeTableCell)) state.activeTableCell.classList.add("is-active-table-cell");
}

function handleTableToolAction(event, table, toolbar) {
  const control = event.target.closest?.("[data-table-tool]");
  if (!control) return;
  const action = control.dataset.tableTool;
  if (action === "toggle") { toolbar.classList.toggle("is-open"); highlightActiveTableCell(table); return; }
  const activeCell = state.activeTableCell && table.contains(state.activeTableCell) ? state.activeTableCell : table.querySelector("td, th");
  if (action === "header-bg") {
    table.style.setProperty("--table-head-bg", control.value);
    const headerCells = table.tHead ? table.tHead.querySelectorAll("th, td") : table.querySelectorAll("tr:first-child th, tr:first-child td");
    headerCells.forEach((cell) => { cell.style.setProperty("background-color", control.value, "important"); });
  }
  if (action === "cell-bg" && activeCell) activeCell.style.setProperty("background-color", control.value, "important");
  if (action === "line") {
    table.style.setProperty("--table-border", control.value);
    table.querySelectorAll("th, td").forEach((cell) => { cell.style.setProperty("border-color", control.value, "important"); });
  }
  if (action === "outer-border") table.style.setProperty("border-color", control.value, "important");
  if (action === "align" && activeCell) cycleTextAlignment(activeCell);
  if (["add-row", "add-col", "delete-row", "delete-col", "wider", "equalize"].includes(action)) applyTableEdits(table, { action });
  highlightActiveTableCell(table);
  syncAndSave("Table updated");
}

function removeFloatingEditorButtons(selector) {
  els.editor.querySelectorAll(selector).forEach((button) => button.remove());
  document.querySelectorAll(selector).forEach((button) => button.remove());
}

async function openTableEditor(table) {
  const result = await openCapsDialog("Edit Table", [
    { name: "columnWidth", label: "Column width", value: "", placeholder: "120px, 30%, or blank" },
    { name: "bg", label: "Background color", value: table.style.backgroundColor || "#28133f" },
    { name: "border", label: "Border color", value: table.style.borderColor || "#e88f69" },
    { name: "action", label: "Action", value: "add-row", placeholder: "add-row, add-col, delete-row, delete-col" },
  ]);
  if (!result) return;
  applyTableEdits(table, result);
  syncAndSave("Table updated");
}

function applyTableEdits(table, result) {
  if (result.bg) table.style.backgroundColor = normalizeHexColor(result.bg) || result.bg;
  if (result.border) {
    table.style.borderColor = normalizeHexColor(result.border) || result.border;
    table.querySelectorAll("th, td").forEach((cell) => { cell.style.borderColor = table.style.borderColor; });
  }
  if (result.columnWidth) table.querySelectorAll("tr > *").forEach((cell) => { cell.style.width = result.columnWidth; });
  if (result.action === "equalize") table.querySelectorAll("tr > *").forEach((cell) => { cell.style.width = `${Math.floor(100 / (table.rows[0]?.cells.length || 1))}%`; });
  if (result.action === "wider") {
    const activeCellForWidth = state.activeTableCell && table.contains(state.activeTableCell) ? state.activeTableCell : null;
    const index = activeCellForWidth?.cellIndex ?? 0;
    table.querySelectorAll("tr").forEach((row) => { const cell = row.cells[index]; if (cell) cell.style.minWidth = `${(parseInt(cell.style.minWidth, 10) || 120) + 40}px`; });
  }
  const action = String(result.action || "").trim().toLowerCase();
  const rows = [...table.rows];
  const activeCell = state.activeTableCell && table.contains(state.activeTableCell) ? state.activeTableCell : rows[rows.length - 1]?.cells[0];
  const activeRow = activeCell?.parentElement;
  const activeRowIndex = activeRow ? rows.indexOf(activeRow) : rows.length - 1;
  const activeCellIndex = activeCell ? activeCell.cellIndex : ((rows[0]?.cells.length || 1) - 1);
  const columnCount = rows[0]?.cells.length || 1;
  if (action === "add-row") {
    const body = table.tBodies[0] || table.createTBody();
    const bodyRows = [...body.rows];
    const bodyIndex = activeRow && activeRow.parentElement === body ? bodyRows.indexOf(activeRow) + 1 : bodyRows.length;
    const row = body.insertRow(Math.max(0, bodyIndex));
    for (let i = 0; i < columnCount; i += 1) row.insertCell(-1).textContent = "";
  }
  if (action === "add-col") {
    rows.forEach((row, rowIndex) => {
      const insertAt = Math.min(activeCellIndex + 1, row.cells.length);
      const cell = row.insertCell(insertAt);
      if (rowIndex === 0 && table.tHead) cell.outerHTML = "<th></th>";
    });
  }
  if (action === "delete-row" && rows.length > 1) table.deleteRow(Math.max(0, activeRowIndex));
  if (action === "delete-col" && columnCount > 1) rows.forEach((row) => row.deleteCell(Math.min(activeCellIndex, row.cells.length - 1)));
}

function handleEditorDragStart(event) {
  const node = event.target.closest("table, .transclusion-ref, .emphasis-box");
  if (!node || !els.editor.contains(node)) return;
  state.draggedEditorNode = node;
  event.dataTransfer?.setData("text/plain", node.dataset.blockId || node.className || "editor-block");
}

function handleEditorDragOver(event) {
  if (state.draggedEditorNode && els.editor.contains(event.target)) event.preventDefault();
}

function handleEditorDrop(event) {
  if (!state.draggedEditorNode) return;
  const target = event.target.closest("table, .transclusion-ref, .emphasis-box, p, h1, h2, h3, li") || event.target;
  if (!els.editor.contains(target) || target === state.draggedEditorNode) return;
  event.preventDefault();
  target.after(state.draggedEditorNode);
  state.draggedEditorNode = null;
  syncAndSave("Writing block moved");
}

async function bulkStyleDocument(docId) {
  const doc = state.documents.find((item) => item.id === docId);
  if (!doc) return;
  const result = await openCapsDialog("Edit All In File", [
    { name: "target", label: "Target", value: "tcards", placeholder: "tcards, tables, emphasis" },
    { name: "color", label: "Color", value: CAPSANOTO_PALETTE.peach, placeholder: "#e88f69" },
  ]);
  if (!result) return;
  const color = normalizeHexColor(result.color) || result.color;
  const target = String(result.target || "").toLowerCase();
  if (target.startsWith("t")) {
    [...doc.content.matchAll(/\{\{([A-Za-z]+-[A-Za-z0-9-]+)\}\}/g)].forEach((match) => {
      const block = state.blocks[match[1]];
      if (block) block.style = { ...(block.style || {}), bg: color, border: color, heading: color };
    });
  } else {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = doc.content;
    const selector = target.startsWith("e") ? ".emphasis-box" : "table";
    wrapper.querySelectorAll(selector).forEach((node) => {
      node.style.backgroundColor = color;
      node.style.borderColor = color;
      node.querySelectorAll?.("th, td").forEach((cell) => { cell.style.borderColor = color; });
    });
    doc.content = wrapper.innerHTML;
  }
  renderActiveDocument();
  renderWritingRoomCards();
  markDirty("Bulk style updated");
}


function loadEditableHelp() {
  const saved = localStorage.getItem(HELP_KEY);
  if (saved) {
    const header = els.helpPanel.querySelector("header");
    const content = els.helpPanel.querySelector(".help-content");
    if (content) content.innerHTML = saved;
    else if (header) {
      const wrapper = document.createElement("div");
      wrapper.className = "help-content";
      [...els.helpPanel.children].filter((child) => child !== header).forEach((child) => wrapper.append(child));
      els.helpPanel.append(wrapper);
      wrapper.innerHTML = saved;
    }
  } else wrapHelpContent();
}

function wrapHelpContent() {
  if (els.helpPanel.querySelector(".help-content")) return;
  const header = els.helpPanel.querySelector("header");
  const wrapper = document.createElement("div");
  wrapper.className = "help-content";
  [...els.helpPanel.children].filter((child) => child !== header).forEach((child) => wrapper.append(child));
  els.helpPanel.append(wrapper);
}

function toggleHelpEditMode() {
  wrapHelpContent();
  const content = els.helpPanel.querySelector(".help-content");
  const editing = content.getAttribute("contenteditable") !== "true";
  content.setAttribute("contenteditable", String(editing));
  els.helpEditButton?.setAttribute("aria-pressed", String(editing));
  if (editing) content.focus();
  else {
    localStorage.setItem(HELP_KEY, content.innerHTML);
    setStatus("Help text saved", "saved");
  }
}

function toggleHelpPanel(show) {
  els.helpPanel.hidden = !show;
  if (show) els.helpPanel.style.zIndex = "70";
}

function hydrateIconButtons() {
  document.querySelectorAll("button[data-icon-src]").forEach((button) => {
    const src = button.dataset.iconSrc;
    if (!src || button.querySelector("img.tool-icon-img")) return;
    const fallback = button.textContent.trim();
    button.textContent = "";
    const image = document.createElement("img");
    image.className = "tool-icon-img";
    image.src = src;
    image.alt = "";
    button.append(image);
    if (fallback) {
      const label = document.createElement("span");
      label.className = "sr-only";
      label.textContent = button.getAttribute("aria-label") || fallback;
      button.append(label);
    }
  });
}

function toggleBlockPanel(show) {
  els.blockPanel.hidden = !show;
  if (show) els.blockIdInput.focus();
}

function saveBlock() {
  const id = els.blockIdInput.value.trim();
  if (!/^[A-Za-z]+-[A-Za-z0-9-]+$/.test(id)) {
    setStatus("Use TCard IDs like Item-Runestones", "dirty");
    return;
  }
  state.blocks[id] = {
    id,
    content: els.blockContentInput.value,
    style: currentTCardStyleFromPanel(),
    updatedAt: new Date().toISOString(),
  };
  renderBlockList();
  renderActiveDocument();
  renderBookmarks();
  markDirty("TCard updated everywhere");
}

function currentTCardStyleFromPanel() {
  return {
    bg: els.blockBgInput.value,
    border: els.blockBorderInput.value,
    text: els.blockTextInput.value,
    heading: els.blockHeadingInput.value,
    size: els.blockTextSizeInput.value || "14",
  };
}

function updateSelectedTCardStyleFromPanel() {
  const id = els.blockIdInput.value.trim();
  const block = state.blocks[id];
  if (!block) return;
  block.style = { ...(block.style || {}), ...currentTCardStyleFromPanel() };
  block.updatedAt = new Date().toISOString();
  renderActiveDocument();
  renderBookmarks();
  renderBlockList();
  setContextStatus(`TCard style updated for ${id}`, "dirty");
  markDirty("TCard style updated");
}

function insertBlockReference() {
  const id = els.blockIdInput.value.trim();
  if (!id) return;
  restoreSelectionRange();
  insertHtml(`{{${escapeHtml(id)}}}`);
  renderActiveDocument();
  renderBookmarks();
}

function renderBlockList() {
  const blocks = Object.values(state.blocks).sort((a, b) => a.id.localeCompare(b.id));
  els.blockList.classList.toggle("is-delete-mode", state.blockDeleteMode);
  els.blockList.innerHTML = blocks.length ? blocks.map((block) => (
    `<div class="block-list-row"><button type="button" data-block-id="${escapeAttr(block.id)}"><strong>${escapeHtml(block.id)}</strong><span>${escapeHtml(block.content).slice(0, 90)}</span></button>${state.blockDeleteMode ? `<button type="button" class="block-delete-x" data-delete-block-id="${escapeAttr(block.id)}" title="Delete TCard">×</button>` : ""}</div>`
  )).join("") : `<p class="panel-help">No reusable TCards yet.</p>`;
}

function toggleBlockDeleteMode() {
  state.blockDeleteMode = !state.blockDeleteMode;
  els.deleteBlockButton?.classList.toggle("is-active", state.blockDeleteMode);
  renderBlockList();
  setStatus(state.blockDeleteMode ? "TCard delete mode on" : "TCard delete mode off", "saved");
}

function getBlockUsage(id) {
  const token = `{{${id}}}`;
  return state.documents.map((doc) => {
    const count = (doc.content.match(new RegExp(escapeRegExp(token), "g")) || []).length;
    return count ? { doc, count } : null;
  }).filter(Boolean);
}

async function confirmDeleteBlock(id) {
  const usage = getBlockUsage(id);
  const decision = await openBlockDeleteDialog(id, usage);
  if (decision === "show-use") {
    await showBlockUsageDialog(id, usage);
    return;
  }
  if (decision !== "yes") return;
  deleteBlockEverywhere(id);
}

function deleteBlockEverywhere(id) {
  delete state.blocks[id];
  state.documents.forEach((doc) => {
    doc.content = doc.content.replace(new RegExp(escapeRegExp(`{{${id}}}`), "g"), "");
  });
  state.blockDeleteMode = false;
  els.deleteBlockButton?.classList.remove("is-active");
  renderActiveDocument();
  renderBlockList();
  renderExportSourceSelect();
  markDirty("TCard deleted everywhere");
  setContextStatus(`Deleted TCard ${id} everywhere`, "saved");
}

function blockUsageSummary(usage) {
  const total = usage.reduce((sum, item) => sum + item.count, 0);
  return { total, documents: usage.length };
}

function openBlockDeleteDialog(id, usage) {
  const { total, documents } = blockUsageSummary(usage);
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "tcard-modal-overlay tcard-delete-modal";
    overlay.innerHTML = `
      <section class="tcard-modal" role="dialog" aria-modal="true" aria-label="Delete Transclusion Card">
        <header><h2>Delete Transclusion Card</h2><button type="button" data-tcard-delete-choice="no" aria-label="Close">×</button></header>
        <div class="tcard-modal-body">
          <p><strong>Warning:</strong> this Transclusion Card is being used <strong>${total}</strong> times in <strong>${documents}</strong> files.</p>
          <p>Deleting it removes the TCard from the system and removes its references everywhere.</p>
          <p class="tcard-delete-id"><strong>${escapeHtml(id)}</strong></p>
        </div>
        <footer>
          <button type="button" data-tcard-delete-choice="show-use">Show Use</button>
          <button type="button" data-tcard-delete-choice="no">No</button>
          <button type="button" class="danger-button" data-tcard-delete-choice="yes">Yes, delete everywhere</button>
        </footer>
      </section>`;
    const close = (choice) => {
      overlay.remove();
      resolve(choice);
    };
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close("no");
      const button = event.target.closest("[data-tcard-delete-choice]");
      if (button) close(button.dataset.tcardDeleteChoice);
    });
    document.body.append(overlay);
    overlay.querySelector("[data-tcard-delete-choice='no']")?.focus();
  });
}

function showBlockUsageDialog(id, usage) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "tcard-modal-overlay tcard-usage-modal";
    const list = usage.length ? usage.map(({ doc, count }, index) => `
      <button type="button" data-usage-index="${index}" class="${index === 0 ? "is-active" : ""}">
        <strong>${escapeHtml(doc.title || "Untitled File")}</strong>
        <span>${count} use${count === 1 ? "" : "s"}</span>
      </button>`).join("") : `<p class="panel-help">No files currently reference this TCard.</p>`;
    overlay.innerHTML = `
      <section class="tcard-modal tcard-usage-dialog" role="dialog" aria-modal="true" aria-label="TCard usage">
        <header><h2>TCard Use: ${escapeHtml(id)}</h2><button type="button" data-close-usage aria-label="Close">×</button></header>
        <div class="tcard-usage-grid">
          <aside class="tcard-usage-list">${list}</aside>
          <article class="tcard-usage-preview" tabindex="0"></article>
        </div>
        <footer><button type="button" data-close-usage>Close</button></footer>
      </section>`;
    const preview = overlay.querySelector(".tcard-usage-preview");
    const renderPreview = (index = 0) => {
      const item = usage[index];
      if (!item) {
        preview.innerHTML = `<p>No preview available.</p>`;
        return;
      }
      preview.innerHTML = blockUsagePreviewHtml(id, item.doc, item.count);
      overlay.querySelectorAll("[data-usage-index]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.usageIndex) === index));
    };
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-close-usage]")) {
        overlay.remove();
        resolve(null);
        return;
      }
      const itemButton = event.target.closest("[data-usage-index]");
      if (itemButton) renderPreview(Number(itemButton.dataset.usageIndex));
    });
    document.body.append(overlay);
    renderPreview(0);
    overlay.querySelector("[data-close-usage]")?.focus();
  });
}

function blockUsagePreviewHtml(id, doc, count) {
  const token = `{{${id}}}`;
  const text = textFromHtml(doc.content || "");
  const index = text.indexOf(token);
  const start = Math.max(0, index >= 0 ? index - 400 : 0);
  const end = Math.min(text.length, index >= 0 ? index + token.length + 400 : 800);
  let snippet = text.slice(start, end).trim() || "This file contains the TCard reference, but no readable preview text was found.";
  snippet = escapeHtml(snippet).replace(new RegExp(escapeRegExp(escapeHtml(token)), "g"), `<mark>${escapeHtml(token)}</mark>`);
  return `
    <h3>${escapeHtml(doc.title || "Untitled File")}</h3>
    <p class="tcard-usage-meta">${count} use${count === 1 ? "" : "s"} · File ID: ${escapeHtml(doc.id)}</p>
    <div class="tcard-usage-snippet">${snippet}</div>`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toggleInlineTCardEditMode() {
  const existingId = state.inlineTCardEditId;
  if (existingId) {
    commitInlineTCardEdit(existingId);
    return;
  }

  const id = els.blockIdInput.value.trim();
  if (!id || !state.blocks[id]) {
    setStatus("Select a TCard first", "dirty");
    return;
  }

  if (!activeDocument().content.includes(`{{${id}}}`)) {
    setStatus("Open a file that contains this TCard before inline editing", "dirty");
    return;
  }

  state.inlineTCardEditId = id;
  updateInlineTCardButtonState();
  renderActiveDocument();
  renderBookmarks();
  const editable = els.editor.querySelector(`.transclusion-ref[data-block-id="${cssEscape(id)}"] .tcard-content`);
  if (!editable) {
    state.inlineTCardEditId = "";
    updateInlineTCardButtonState();
    renderActiveDocument();
    setStatus("Could not find this TCard in the visible file", "dirty");
    return;
  }
  editable.focus();
  placeCursorAtEnd(editable);
  setStatus("Edit the TCard in the writing surface, then click Change", "saved");
}

function commitInlineTCardEdit(id = state.inlineTCardEditId) {
  if (!id || !state.blocks[id]) {
    state.inlineTCardEditId = "";
    updateInlineTCardButtonState();
    return;
  }

  const selector = `.transclusion-ref.is-inline-editing[data-block-id="${cssEscape(id)}"] .tcard-content`;
  const activeEditable = document.activeElement?.closest?.(selector);
  const editable = activeEditable || els.editor.querySelector(selector);
  if (!editable) {
    state.inlineTCardEditId = "";
    updateInlineTCardButtonState();
    renderActiveDocument();
    setStatus("Inline TCard edit cancelled", "dirty");
    return;
  }

  const nextContent = inlineTCardContentToText(editable);
  state.blocks[id] = {
    ...state.blocks[id],
    content: nextContent,
    updatedAt: new Date().toISOString(),
  };
  if (els.blockIdInput.value.trim() === id) els.blockContentInput.value = nextContent;
  state.inlineTCardEditId = "";
  updateInlineTCardButtonState();
  renderBlockList();
  renderActiveDocument();
  renderBookmarks();
  renderExportSourceSelect();
  markDirty("TCard changed everywhere");
  setStatus("TCard changed everywhere", "saved");
}

function updateInlineTCardButtonState() {
  if (!els.editBlockInlineButton) return;
  const isEditing = Boolean(state.inlineTCardEditId);
  els.editBlockInlineButton.textContent = isEditing ? "Change" : "Edit TCard";
  els.editBlockInlineButton.classList.toggle("is-flashing", isEditing);
  els.editBlockInlineButton.setAttribute("aria-pressed", String(isEditing));
}

function inlineTCardContentToText(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll("br").forEach((br) => br.replaceWith(document.createTextNode("\n")));
  clone.querySelectorAll("div, p").forEach((element) => {
    if (element !== clone) element.after(document.createTextNode("\n"));
  });
  return clone.textContent.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function placeCursorAtEnd(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function selectBlock(id) {
  const block = state.blocks[id];
  if (!block) return;
  els.blockIdInput.value = block.id;
  els.blockContentInput.value = block.content;
  els.blockBgInput.value = normalizeHexColor(block.style?.bg) || CAPSANOTO_PALETTE.deepPlum;
  els.blockBorderInput.value = normalizeHexColor(block.style?.border) || CAPSANOTO_PALETTE.peach;
  els.blockTextInput.value = normalizeHexColor(block.style?.text) || CAPSANOTO_PALETTE.parchment;
  els.blockHeadingInput.value = normalizeHexColor(block.style?.heading) || CAPSANOTO_PALETTE.peach;
  els.blockTextSizeInput.value = block.style?.size || "14";
  updateInlineTCardButtonState();
}

function syncAndSave(message) {
  syncEditorToDocument();
  markDirty(message);
}

function markDirty(message = "Saving locally") {
  const safeMessage = message && message.trim() ? message : "Saving locally";
  setStatus(safeMessage, "dirty");
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => persistNow("Autosaved locally"), AUTOSAVE_DELAY);
}

function persistNow(message = "Autosaved locally") {
  const now = new Date().toISOString();
  const doc = activeDocument();
  if (doc) doc.localDraftAt = now;
  localStorage.setItem(STORAGE_KEY, serializedWorkspace());
  setStatus(message || "Autosaved locally", "saved");
  if (state.folderMode.enabled && state.folderMode.directoryHandle) {
    void saveFolderModeSnapshot("Saved to disk").catch((error) => {
      console.warn("Folder Mode disk save failed", error);
      setStatus("Disk save failed — local backup kept", "dirty");
      updateFolderModeStatus("Disk save failed — local backup kept");
    });
  }
}




/* Project Settings + Google Drive account shell. */
function loadGoogleDriveStorageState() {
  try {
    const saved = JSON.parse(localStorage.getItem(GOOGLE_DRIVE_STORAGE_KEY) || "{}");
    const sessionToken = sessionStorage.getItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY) || "";
    state.googleDrive.accessToken = sessionToken;
    state.googleDrive.connectedAt = saved.connectedAt || "";
    state.googleDrive.expiresAt = saved.expiresAt || "";
    state.googleDrive.accountLabel = saved.accountLabel || "";
    state.googleDrive.rootFolderId = saved.rootFolderId || "";
    state.googleDrive.projectFolderId = saved.projectFolderId || "";
    state.googleDrive.projectName = saved.projectName || "";
    state.googleDrive.lastSyncAt = saved.lastSyncAt || "";
    state.googleDrive.connected = Boolean(sessionToken);
    if (sessionToken) {
      state.googleDrive.lastStatus = saved.lastStatus || "Google Drive token active for this browser session.";
    } else if (saved.connected || saved.connectedAt) {
      state.googleDrive.lastStatus = "Google Drive account was connected previously. Click Connect Google Account to refresh the browser token before syncing.";
    } else {
      state.googleDrive.lastStatus = saved.lastStatus || "Not connected";
    }
  } catch {
    state.googleDrive.lastStatus = "Google Drive connection state could not be read";
  }
  updateProjectSettingsStatus();
}

function saveGoogleDriveStorageState() {
  const payload = {
    connected: state.googleDrive.connected,
    connectedAt: state.googleDrive.connectedAt,
    expiresAt: state.googleDrive.expiresAt,
    accountLabel: state.googleDrive.accountLabel,
    lastStatus: state.googleDrive.lastStatus,
    rootFolderId: state.googleDrive.rootFolderId,
    projectFolderId: state.googleDrive.projectFolderId,
    projectName: state.googleDrive.projectName,
    lastSyncAt: state.googleDrive.lastSyncAt,
  };
  localStorage.setItem(GOOGLE_DRIVE_STORAGE_KEY, JSON.stringify(payload));
}

function toggleProjectSettingsPanel(show = null) {
  if (!els.projectSettingsPanel) return;
  const shouldShow = show === null ? els.projectSettingsPanel.hidden : Boolean(show);
  els.projectSettingsPanel.hidden = !shouldShow;
  if (shouldShow) {
    toggleSettingsPanel(false);
    updateProjectSettingsStatus();
    setContextStatus("Project Settings: Google Drive primary, HDD backup, local emergency draft", "saved");
  }
}

function updateProjectSettingsStatus(message = "") {
  const active = activeDocument?.();
  const storageMode = state.googleDrive.connected ? "Google Drive primary · HDD backup optional · localStorage emergency draft" : "Google Drive not connected · HDD backup/local draft available";
  if (els.projectInfoStatus) {
    const disk = state.folderMode.lastDiskSaveAt ? new Date(state.folderMode.lastDiskSaveAt).toLocaleString() : "never";
    const online = state.googleDrive.lastSyncAt ? new Date(state.googleDrive.lastSyncAt).toLocaleString() : (state.googleDrive.connectedAt ? `connected ${new Date(state.googleDrive.connectedAt).toLocaleString()}` : "not connected");
    const design = state.designSettings && Object.keys(state.designSettings).length ? "Writing Room theme active" : "Default theme";
    const onlineProject = state.googleDrive.projectName ? `Google project: ${state.googleDrive.projectName}` : "Google project: none selected";
    els.projectInfoStatus.innerHTML = `<strong>${escapeHtml(state.writingRoomName || "Writing Room")}</strong><br>Active file: ${escapeHtml(active?.title || "No active file")}<br>Storage: ${escapeHtml(storageMode)}<br>${escapeHtml(onlineProject)}<br>Design: ${escapeHtml(design)}<br>Last online sync: ${escapeHtml(online)}<br>Last HDD backup: ${escapeHtml(disk)}`;
  }
  if (els.googleDriveStatus) {
    const expires = state.googleDrive.expiresAt ? new Date(state.googleDrive.expiresAt).toLocaleString() : "not available";
    const connected = state.googleDrive.accessToken ? "Connected" : (state.googleDrive.accountLabel ? "Reconnect required" : "Not connected");
    const label = state.googleDrive.accountLabel ? ` · ${escapeHtml(state.googleDrive.accountLabel)}` : "";
    const project = state.googleDrive.projectName ? `<br>Online project: ${escapeHtml(state.googleDrive.projectName)}` : "";
    const sync = state.googleDrive.lastSyncAt ? `<br>Last online sync: ${escapeHtml(new Date(state.googleDrive.lastSyncAt).toLocaleString())}` : "";
    const driveLink = googleDriveProjectUrl();
    const driveLine = driveLink ? `<br><a href="${escapeHtml(driveLink)}" target="_blank" rel="noopener">Open online project folder in Google Drive</a>` : "";
    els.googleDriveStatus.innerHTML = `<strong>${connected}${label}</strong><br>${escapeHtml(state.googleDrive.lastStatus || "Google Drive is not connected.")}<br>Token expiry: ${escapeHtml(expires)}${project}${sync}${driveLine}${message ? `<br>${escapeHtml(message)}` : ""}`;
  }
  if (els.projectFolderModeStatus) {
    const local = state.folderMode.enabled ? `Backup folder active: ${state.folderMode.projectName || "selected folder"}` : "No backup folder selected";
    const disk = state.folderMode.lastDiskSaveAt ? `Last HDD backup: ${new Date(state.folderMode.lastDiskSaveAt).toLocaleString()}` : "Last HDD backup: never";
    els.projectFolderModeStatus.innerHTML = `<strong>${escapeHtml(local)}</strong><br>${escapeHtml(disk)}`;
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity script failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity script failed to load"));
    document.head.appendChild(script);
  });
}

async function connectGoogleDriveAccount(forceAccountChoice = false) {
  try {
    setStatus("Connecting Google Drive", "dirty");
    await loadGoogleIdentityScript();
    if (!window.google?.accounts?.oauth2) throw new Error("Google Identity Services is unavailable.");
    state.googleDrive.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      prompt: forceAccountChoice ? "select_account consent" : "consent",
      callback: (response) => handleGoogleDriveTokenResponse(response, forceAccountChoice),
      error_callback: (error) => handleGoogleDriveTokenError(error),
    });
    state.googleDrive.tokenClient.requestAccessToken({ prompt: forceAccountChoice ? "select_account consent" : "consent" });
  } catch (error) {
    state.googleDrive.connected = false;
    state.googleDrive.initError = error.message;
    state.googleDrive.lastStatus = `Google Drive connection failed: ${error.message}`;
    saveGoogleDriveStorageState();
    setStatus("Google Drive connection failed", "dirty");
    updateProjectSettingsStatus(error.message);
  }
}

function handleGoogleDriveTokenResponse(response) {
  if (response?.error) return handleGoogleDriveTokenError(response);
  state.googleDrive.accessToken = response.access_token || "";
  if (state.googleDrive.accessToken) sessionStorage.setItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY, state.googleDrive.accessToken);
  state.googleDrive.connected = Boolean(state.googleDrive.accessToken);
  const now = Date.now();
  state.googleDrive.connectedAt = new Date(now).toISOString();
  state.googleDrive.expiresAt = response.expires_in ? new Date(now + Number(response.expires_in) * 1000).toISOString() : "";
  state.googleDrive.accountLabel = "Connected Google account";
  state.googleDrive.lastStatus = "Google Drive token received. Create Online Project or Sync Now can now write project files to Drive.";
  saveGoogleDriveStorageState();
  setStatus("Google Drive connected", "saved");
  updateProjectSettingsStatus("Google Drive connected");
}

function handleGoogleDriveTokenError(error) {
  const message = error?.message || error?.type || error?.error || "Google sign-in was cancelled or failed.";
  state.googleDrive.connected = false;
  state.googleDrive.accessToken = "";
  state.googleDrive.lastStatus = message;
  saveGoogleDriveStorageState();
  setStatus("Google Drive not connected", "dirty");
  updateProjectSettingsStatus(message);
}

function disconnectGoogleDriveAccount() {
  if (state.googleDrive.accessToken && window.google?.accounts?.oauth2?.revoke) {
    try { window.google.accounts.oauth2.revoke(state.googleDrive.accessToken); } catch {}
  }
  sessionStorage.removeItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY);
  state.googleDrive.accessToken = "";
  state.googleDrive.connected = false;
  state.googleDrive.connectedAt = "";
  state.googleDrive.expiresAt = "";
  state.googleDrive.accountLabel = "";
  state.googleDrive.rootFolderId = "";
  state.googleDrive.projectFolderId = "";
  state.googleDrive.projectName = "";
  state.googleDrive.lastSyncAt = "";
  state.googleDrive.lastStatus = "Disconnected. Local backup and emergency drafts are still available.";
  saveGoogleDriveStorageState();
  setStatus("Google Drive disconnected", "saved");
  updateProjectSettingsStatus();
}


async function ensureGoogleDriveAccess(action = "use Google Drive") {
  if (!state.googleDrive.accessToken) {
    state.googleDrive.connected = false;
    state.googleDrive.lastStatus = `Click Connect Google Account to refresh permission before you ${action}.`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Google Drive reconnect needed", "dirty");
    return false;
  }
  const expiresAt = Date.parse(state.googleDrive.expiresAt || "");
  if (Number.isFinite(expiresAt) && expiresAt < Date.now() + 30000) {
    state.googleDrive.lastStatus = "Google Drive token expired. Click Connect or Switch Google Account again.";
    state.googleDrive.accessToken = "";
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Google Drive token expired", "dirty");
    return false;
  }
  return true;
}

function googleDriveHeaders(extra = {}) {
  return { Authorization: `Bearer ${state.googleDrive.accessToken}`, ...extra };
}

async function googleDriveRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: googleDriveHeaders(options.headers || {}),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || "Google Drive request failed";
    throw new Error(message);
  }
  return payload;
}

function driveQueryEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function listGoogleDriveFiles(query, fields = "files(id,name,mimeType,modifiedTime,parents)") {
  const params = new URLSearchParams({ q: query, fields, pageSize: "100" });
  const payload = await googleDriveRequest(`${GOOGLE_DRIVE_API_ROOT}/files?${params.toString()}`);
  return payload?.files || [];
}

async function findGoogleDriveItem(name, parentId = "", mimeType = "") {
  const clauses = [`name = '${driveQueryEscape(name)}'`, "trashed = false"];
  if (parentId) clauses.push(`'${driveQueryEscape(parentId)}' in parents`);
  if (mimeType) clauses.push(`mimeType = '${driveQueryEscape(mimeType)}'`);
  const files = await listGoogleDriveFiles(clauses.join(" and "), "files(id,name,mimeType,modifiedTime,parents)");
  return files[0] || null;
}

async function createGoogleDriveFolder(name, parentId = "") {
  const metadata = { name, mimeType: GOOGLE_DRIVE_FOLDER_MIME };
  if (parentId) metadata.parents = [parentId];
  return googleDriveRequest(`${GOOGLE_DRIVE_API_ROOT}/files?fields=id,name,mimeType,parents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
}

async function ensureGoogleDriveFolder(name, parentId = "") {
  const existing = await findGoogleDriveItem(name, parentId, GOOGLE_DRIVE_FOLDER_MIME);
  if (existing?.id) return existing;
  return createGoogleDriveFolder(name, parentId);
}

async function ensureGoogleDriveFolderPath(parts, parentId = "") {
  let currentParent = parentId;
  let current = null;
  for (const part of parts.filter(Boolean)) {
    current = await ensureGoogleDriveFolder(part, currentParent);
    currentParent = current.id;
  }
  return current;
}

async function getGoogleDriveFolderPath(parts, parentId = "") {
  let currentParent = parentId;
  let current = null;
  for (const part of parts.filter(Boolean)) {
    current = await findGoogleDriveItem(part, currentParent, GOOGLE_DRIVE_FOLDER_MIME);
    if (!current?.id) throw new Error(`Missing Google Drive folder: ${part}`);
    currentParent = current.id;
  }
  return current;
}

async function ensureGoogleDriveProject(projectName = "") {
  if (!(await ensureGoogleDriveAccess("create or sync an online project"))) return null;
  const safeName = safePathPart(projectName || state.googleDrive.projectName || state.writingRoomName || "Writing Room");
  setStatus("Preparing Google Drive project…", "dirty");
  const root = await ensureGoogleDriveFolder(GOOGLE_DRIVE_ROOT_FOLDER_NAME);
  const project = await ensureGoogleDriveFolder(safeName, root.id);
  await ensureGoogleDriveFolder("assets", project.id);
  state.googleDrive.rootFolderId = root.id;
  state.googleDrive.projectFolderId = project.id;
  state.googleDrive.projectName = project.name || safeName;
  state.googleDrive.lastStatus = `Online project ready: ${state.googleDrive.projectName}`;
  saveGoogleDriveStorageState();
  updateProjectSettingsStatus(state.googleDrive.lastStatus);
  return project;
}

function onlineProjectPayload() {
  const payload = folderModeProjectPayload();
  payload.storageMode = "google-drive-primary";
  payload.googleDrive = {
    rootFolderName: GOOGLE_DRIVE_ROOT_FOLDER_NAME,
    rootFolderId: state.googleDrive.rootFolderId || "",
    projectFolderId: state.googleDrive.projectFolderId || "",
    projectName: state.googleDrive.projectName || state.writingRoomName || "Writing Room",
    lastSyncAt: new Date().toISOString(),
  };
  return payload;
}

async function upsertGoogleDriveTextFile(parentId, name, content, mimeType = "text/plain") {
  const existing = await findGoogleDriveItem(name, parentId, "");
  if (existing?.id) {
    await googleDriveRequest(`${GOOGLE_DRIVE_UPLOAD_ROOT}/files/${encodeURIComponent(existing.id)}?uploadType=media&fields=id,name,modifiedTime`, {
      method: "PATCH",
      headers: { "Content-Type": mimeType },
      body: content,
    });
    return existing;
  }
  const boundary = `capsanoto_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadata = { name, parents: [parentId], mimeType };
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}; charset=UTF-8`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return googleDriveRequest(`${GOOGLE_DRIVE_UPLOAD_ROOT}/files?uploadType=multipart&fields=id,name,modifiedTime`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

async function uploadGoogleDriveTextAtPath(projectFolderId, path, content, mimeType = "text/plain") {
  const parts = path.split("/").filter(Boolean);
  const fileName = parts.pop();
  const folder = parts.length ? await ensureGoogleDriveFolderPath(parts, projectFolderId) : { id: projectFolderId };
  return upsertGoogleDriveTextFile(folder.id, fileName, content, mimeType);
}

async function readGoogleDriveTextFile(parentId, name) {
  const file = await findGoogleDriveItem(name, parentId, "");
  if (!file?.id) throw new Error(`Missing Google Drive file: ${name}`);
  const response = await fetch(`${GOOGLE_DRIVE_API_ROOT}/files/${encodeURIComponent(file.id)}?alt=media`, {
    headers: googleDriveHeaders(),
  });
  if (!response.ok) throw new Error(`Could not read ${name} from Google Drive.`);
  return response.text();
}

async function readGoogleDriveTextAtPath(projectFolderId, path) {
  const parts = path.split("/").filter(Boolean);
  const fileName = parts.pop();
  const folder = parts.length ? await getGoogleDriveFolderPath(parts, projectFolderId) : { id: projectFolderId };
  return readGoogleDriveTextFile(folder.id, fileName);
}


function googleDriveProjectUrl() {
  return state.googleDrive.projectFolderId ? `https://drive.google.com/drive/folders/${encodeURIComponent(state.googleDrive.projectFolderId)}` : "";
}

function openGoogleDriveProjectFolder() {
  const url = googleDriveProjectUrl();
  if (!url) {
    state.googleDrive.lastStatus = "Create or open an online project before using Open in Drive.";
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("No Drive folder selected", "dirty");
    return;
  }
  window.open(url, "_blank", "noopener");
  setStatus("Opened Google Drive folder", "saved");
}

async function copyGoogleDriveProjectLink() {
  const url = googleDriveProjectUrl();
  if (!url) {
    state.googleDrive.lastStatus = "No online project folder link is available yet.";
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("No Drive link to copy", "dirty");
    return;
  }
  await copyText(url);
  setStatus("Copied Google Drive folder link", "saved");
}

async function createGoogleDriveOnlineProject() {
  try {
    if (!(await ensureGoogleDriveAccess("create an online project"))) return;
    const result = await openCapsDialog("Create Online Project", [
      { name: "projectName", label: "Online project folder name", value: state.googleDrive.projectName || state.writingRoomName || "Writing Room", placeholder: "Forever Bound" },
      { html: "<p>This creates/updates a visible Google Drive folder at <strong>Capsanoto / Project Name</strong>, then uploads the project JSON, TCard library, and Markdown files.</p>" },
    ]);
    if (!result?.projectName) return;
    await ensureGoogleDriveProject(result.projectName.trim());
    await syncGoogleDriveProject({ writeAll: true, silentEnsure: true });
  } catch (error) {
    console.error(error);
    state.googleDrive.lastStatus = `Create Online Project failed: ${error.message}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Google Drive project failed", "dirty");
  }
}

async function syncGoogleDriveProject(options = {}) {
  try {
    if (!(await ensureGoogleDriveAccess("sync the online project"))) return;
    const project = options.silentEnsure && state.googleDrive.projectFolderId
      ? { id: state.googleDrive.projectFolderId, name: state.googleDrive.projectName || state.writingRoomName }
      : await ensureGoogleDriveProject(state.googleDrive.projectName || state.writingRoomName);
    if (!project?.id) return;
    syncEditorToDocument();
    await prepareDocumentsForFolderMode({ rebuildPaths: !options.activeOnly });
    setStatus("Syncing to Google Drive…", "dirty");
    const now = new Date().toISOString();
    const projectPayload = onlineProjectPayload();
    await upsertGoogleDriveTextFile(project.id, "capsanoto.project.json", JSON.stringify(projectPayload, null, 2), "application/json");
    await upsertGoogleDriveTextFile(project.id, "filing-manifest.json", JSON.stringify(filingManifest(), null, 2), "application/json");
    await upsertGoogleDriveTextFile(project.id, "tcards.json", JSON.stringify({ schemaVersion: 1, updatedAt: now, blocks: state.blocks }, null, 2), "application/json");
    await ensureGoogleDriveFolder("assets", project.id);
    const docsToWrite = options.activeOnly ? [activeDocument()].filter(Boolean) : state.documents;
    for (const doc of docsToWrite) {
      await uploadGoogleDriveTextAtPath(project.id, doc.diskPath || suggestedMarkdownPath(doc), documentToCapsMarkdown(doc), "text/markdown");
      doc.onlineSavedAt = now;
    }
    state.googleDrive.projectFolderId = project.id;
    state.googleDrive.projectName = project.name || state.googleDrive.projectName || state.writingRoomName;
    state.googleDrive.lastSyncAt = now;
    state.googleDrive.lastStatus = `Synced ${docsToWrite.length} file${docsToWrite.length === 1 ? "" : "s"} to Google Drive.`;
    saveGoogleDriveStorageState();
    localStorage.setItem(STORAGE_KEY, serializedWorkspace());
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Synced to Google Drive", "saved");
  } catch (error) {
    console.error(error);
    state.googleDrive.lastStatus = `Sync failed: ${error.message}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Sync failed — saved locally", "dirty");
  }
}


function localProjectHealthSummary() {
  const newestDocument = state.documents.reduce((latest, doc) => {
    const stamp = Date.parse(doc.updatedAt || doc.localDraftAt || doc.diskSavedAt || 0);
    return Number.isFinite(stamp) && stamp > latest ? stamp : latest;
  }, 0);
  return {
    writingRoomName: state.writingRoomName || "Writing Room",
    documents: state.documents.length,
    tcards: Object.keys(state.blocks || {}).length,
    folders: state.filingGroups.length,
    tabs: state.filingTabs.length,
    trash: state.trash.length,
    deprecated: state.deprecated.length,
    updatedAt: newestDocument ? new Date(newestDocument).toISOString() : "",
    designSettings: currentDesignSettings() && Object.keys(currentDesignSettings()).length ? "present" : "default",
  };
}

function projectPayloadHealthSummary(payload = {}, tcardPayload = null) {
  const docs = Array.isArray(payload.documents) ? payload.documents : [];
  const tcards = tcardPayload?.blocks && typeof tcardPayload.blocks === "object"
    ? Object.keys(tcardPayload.blocks).length
    : (payload.blocks && typeof payload.blocks === "object" ? Object.keys(payload.blocks).length : 0);
  return {
    writingRoomName: payload.writingRoomName || payload.googleDrive?.projectName || "Writing Room",
    documents: docs.length,
    tcards,
    folders: Array.isArray(payload.filingGroups) ? payload.filingGroups.length : 0,
    tabs: Array.isArray(payload.filingTabs) ? payload.filingTabs.length : 0,
    trash: Array.isArray(payload.trash) ? payload.trash.length : 0,
    deprecated: Array.isArray(payload.deprecated) ? payload.deprecated.length : 0,
    updatedAt: payload.updatedAt || "",
    designSettings: payload.designSettings && typeof payload.designSettings === "object" && Object.keys(payload.designSettings).length ? "present" : "default",
  };
}

function storageHealthLines(label, summary) {
  const updated = summary.updatedAt ? new Date(summary.updatedAt).toLocaleString() : "not recorded";
  return [
    `${label}: ${summary.writingRoomName}`,
    `Files: ${summary.documents} · TCards: ${summary.tcards} · Folders: ${summary.folders} · Tabs: ${summary.tabs}`,
    `Trash: ${summary.trash} · Deprecated: ${summary.deprecated} · Theme: ${summary.designSettings}`,
    `Updated: ${updated}`,
  ];
}

function compareStorageSummaries(remote, local) {
  const warnings = [];
  if (remote.documents !== local.documents) warnings.push(`file count differs (${remote.documents} online/backup vs ${local.documents} open)`);
  if (remote.tcards !== local.tcards) warnings.push(`TCard count differs (${remote.tcards} online/backup vs ${local.tcards} open)`);
  if (remote.folders !== local.folders) warnings.push(`folder count differs (${remote.folders} online/backup vs ${local.folders} open)`);
  if (remote.tabs !== local.tabs) warnings.push(`tab count differs (${remote.tabs} online/backup vs ${local.tabs} open)`);
  const remoteUpdated = Date.parse(remote.updatedAt || "");
  const localUpdated = Date.parse(local.updatedAt || "");
  if (Number.isFinite(remoteUpdated) && Number.isFinite(localUpdated)) {
    if (remoteUpdated > localUpdated + 1000) warnings.push("stored project looks newer than the open Writing Room");
    if (localUpdated > remoteUpdated + 1000) warnings.push("open Writing Room looks newer than the stored project");
  }
  return warnings;
}

async function checkGoogleDriveProjectStatus() {
  try {
    if (!(await ensureGoogleDriveAccess("check the online project status"))) return;
    if (!state.googleDrive.projectFolderId) {
      state.googleDrive.lastStatus = "No Google Drive project folder is selected yet. Use Create Online Project or Open Online Project first.";
      saveGoogleDriveStorageState();
      updateProjectSettingsStatus(state.googleDrive.lastStatus);
      setStatus("No online project selected", "dirty");
      return;
    }
    setStatus("Checking Google Drive status…", "dirty");
    const projectText = await readGoogleDriveTextFile(state.googleDrive.projectFolderId, "capsanoto.project.json");
    const project = JSON.parse(projectText);
    const tcardText = await readGoogleDriveTextFile(state.googleDrive.projectFolderId, "tcards.json").catch(() => "");
    const tcardPayload = tcardText ? JSON.parse(tcardText) : null;
    const remote = projectPayloadHealthSummary(project, tcardPayload);
    const local = localProjectHealthSummary();
    const warnings = compareStorageSummaries(remote, local);
    const lines = [
      ...storageHealthLines("Google Drive", remote),
      ...storageHealthLines("Open Writing Room", local),
      warnings.length ? `Check: ${warnings.join("; ")}` : "Check: Google Drive and the open Writing Room look aligned by counts.",
    ];
    state.googleDrive.lastStatus = lines.join("\n");
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus(warnings.length ? "Storage differences found" : "Google Drive status checked", warnings.length ? "dirty" : "saved");
  } catch (error) {
    console.error(error);
    state.googleDrive.lastStatus = `Online status check failed: ${error.message}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Online status check failed", "dirty");
  }
}

async function listGoogleDriveProjects() {
  if (!(await ensureGoogleDriveAccess("open an online project"))) return [];
  const root = await ensureGoogleDriveFolder(GOOGLE_DRIVE_ROOT_FOLDER_NAME);
  state.googleDrive.rootFolderId = root.id;
  saveGoogleDriveStorageState();
  return listGoogleDriveFiles(`'${driveQueryEscape(root.id)}' in parents and mimeType = '${GOOGLE_DRIVE_FOLDER_MIME}' and trashed = false`, "files(id,name,mimeType,modifiedTime)");
}

async function openGoogleDriveOnlineProject() {
  try {
    const projects = await listGoogleDriveProjects();
    if (!projects.length) {
      state.googleDrive.lastStatus = "No Capsanoto online projects found in this Google Drive account.";
      updateProjectSettingsStatus(state.googleDrive.lastStatus);
      setStatus("No online projects found", "dirty");
      return;
    }
    const sortedProjects = [...projects].sort((a, b) => (b.modifiedTime || "").localeCompare(a.modifiedTime || ""));
    const result = await openCapsDialog("Open Online Project", [
      { html: `<p>Choose a Capsanoto Writing Room project from this Google Drive account.</p>` },
      {
        name: "projectId",
        label: "Online Writing Room",
        value: state.googleDrive.projectFolderId || sortedProjects[0].id,
        options: sortedProjects.map((item) => ({
          value: item.id,
          label: `${item.name}${item.modifiedTime ? ` · ${new Date(item.modifiedTime).toLocaleString()}` : ""}`,
        })),
      },
    ]);
    if (!result?.projectId) return;
    const selected = sortedProjects.find((item) => item.id === result.projectId);
    if (!selected?.id) throw new Error("Selected project folder was not found.");
    await loadGoogleDriveProject(selected);
  } catch (error) {
    console.error(error);
    state.googleDrive.lastStatus = `Open Online Project failed: ${error.message}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Open online project failed", "dirty");
  }
}

async function loadGoogleDriveProject(projectFolder) {
  setStatus("Opening Google Drive project…", "dirty");
  const projectText = await readGoogleDriveTextFile(projectFolder.id, "capsanoto.project.json");
  const project = JSON.parse(projectText);
  state.writingRoomName = project.writingRoomName || project.googleDrive?.projectName || projectFolder.name || "Writing Room";
  state.filingGroups = Array.isArray(project.filingGroups) ? project.filingGroups : defaultFilingGroups();
  state.filingTabs = Array.isArray(project.filingTabs) ? project.filingTabs : [];
  state.trash = Array.isArray(project.trash) ? project.trash : [];
  state.deprecated = Array.isArray(project.deprecated) ? project.deprecated : [];
  state.deprecatedParagraphs = Array.isArray(project.deprecatedParagraphs) ? project.deprecatedParagraphs : [];
  if (project.designSettings && typeof project.designSettings === "object") {
    setProjectDesignSettings(project.designSettings, { persistLocal: true });
    applySavedDesignSettings();
    loadDesignForm();
  }
  const tcardText = await readGoogleDriveTextFile(projectFolder.id, "tcards.json").catch(() => "");
  if (tcardText) {
    const payload = JSON.parse(tcardText);
    state.blocks = payload?.blocks && typeof payload.blocks === "object" ? payload.blocks : (project.blocks || {});
  } else {
    state.blocks = project.blocks || {};
  }
  state.documents = [];
  for (const docMeta of project.documents || []) {
    const doc = { ...docMeta };
    if (doc.diskPath) {
      try {
        const markdown = await readGoogleDriveTextAtPath(projectFolder.id, doc.diskPath);
        Object.assign(doc, capsMarkdownToDocument(markdown, doc));
        doc.onlineSavedAt = new Date().toISOString();
      } catch (error) {
        console.warn(`Could not read ${doc.diskPath} from Google Drive`, error);
        doc.content = doc.content || `<h1>${escapeHtml(doc.title || "Missing File")}</h1><p>Capsanoto could not read this Markdown file from Google Drive.</p>`;
      }
    }
    state.documents.push(doc);
  }
  normalizeFilingHierarchy();
  if (!state.documents.length) createDocument();
  state.activeId = project.activeId && state.documents.some((doc) => doc.id === project.activeId) ? project.activeId : state.documents[0].id;
  state.googleDrive.projectFolderId = projectFolder.id;
  state.googleDrive.projectName = projectFolder.name || state.writingRoomName;
  state.googleDrive.lastSyncAt = project.updatedAt || new Date().toISOString();
  state.googleDrive.lastStatus = `Opened online project: ${state.googleDrive.projectName}`;
  saveGoogleDriveStorageState();
  localStorage.setItem(STORAGE_KEY, serializedWorkspace());
  renderAll();
  updateUrl();
  updateProjectSettingsStatus(state.googleDrive.lastStatus);
  setStatus("Opened Google Drive project", "saved");
}


function resetWritingRoomState(projectName) {
  const now = new Date().toISOString();
  const safeName = projectName?.trim() || "Untitled Writing Room";
  const documentId = `doc-${slugify(safeName || "writing-room")}-${Date.now()}`;
  state.writingRoomName = safeName;
  state.documents = [{
    id: documentId,
    title: "New Lore Document",
    tags: [],
    updatedAt: now,
    content: '<h1 id="new-lore-document">New Lore Document</h1><p>Start writing here.</p>',
    filingGroupId: "writing-room-tabs",
    filingTabId: "tab-writing-room-tabs-default",
    diskPath: "",
    diskSavedAt: "",
    localDraftAt: now,
  }];
  state.blocks = {};
  state.activeId = documentId;
  state.filingGroups = defaultFilingGroups();
  state.filingTabs = [];
  normalizeFilingHierarchy();
  const firstTab = state.filingTabs.find((tab) => tab.groupId === "writing-room-tabs") || state.filingTabs[0];
  state.documents[0].filingGroupId = firstTab?.groupId || "writing-room-tabs";
  state.documents[0].filingTabId = firstTab?.id || "tab-writing-room-tabs-default";
  state.trash = [];
  state.deprecated = [];
  state.deprecatedParagraphs = [];
  state.exportItems = [];
  state.googleDrive.projectFolderId = "";
  state.googleDrive.projectName = "";
  state.googleDrive.lastSyncAt = "";
  state.googleDrive.lastStatus = state.googleDrive.accessToken ? "New Writing Room is local until Create Online Project or Sync Now is used." : state.googleDrive.lastStatus;
}

async function createNewWritingRoomProject() {
  try {
    const result = await openCapsDialog("New Writing Room", [
      { html: "<p>This creates a fresh local Writing Room in the current browser. It does not delete Google Drive or HDD backup files. Sync or backup when you are ready.</p>" },
      { name: "projectName", label: "Writing Room name", value: "New Writing Room", placeholder: "Forever Bound" },
      { name: "confirm", checkbox: true, label: "Create a new blank Writing Room and replace the currently open local workspace.", footer: true },
    ]);
    if (!result?.projectName || result.confirm !== "on") return;
    syncEditorToDocument();
    resetWritingRoomState(result.projectName);
    localStorage.setItem(STORAGE_KEY, serializedWorkspace());
    saveGoogleDriveStorageState();
    renderAll();
    updateUrl();
    updateProjectSettingsStatus("New Writing Room created locally. Use Create Online Project, Sync Now, or Sync Backup Folder when ready.");
    setStatus("New Writing Room created", "saved");
  } catch (error) {
    console.error(error);
    setStatus("New Writing Room failed", "dirty");
  }
}

async function duplicateGoogleDriveProject() {
  try {
    syncEditorToDocument();
    if (!(await ensureGoogleDriveAccess("duplicate this Writing Room online"))) return;
    const result = await openCapsDialog("Duplicate Writing Room", [
      { html: "<p>This makes a new Google Drive project folder using the currently open Writing Room content.</p>" },
      { name: "projectName", label: "New online copy name", value: `${state.writingRoomName || "Writing Room"} Copy`, placeholder: "Forever Bound Copy" },
    ]);
    if (!result?.projectName) return;
    const previousProjectId = state.googleDrive.projectFolderId;
    const previousProjectName = state.googleDrive.projectName;
    state.googleDrive.projectFolderId = "";
    state.googleDrive.projectName = result.projectName.trim();
    await ensureGoogleDriveProject(state.googleDrive.projectName);
    await syncGoogleDriveProject({ writeAll: true, silentEnsure: true });
    state.googleDrive.lastStatus = `Duplicated online Writing Room as: ${state.googleDrive.projectName}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Duplicated online Writing Room", "saved");
    if (!state.googleDrive.projectFolderId && previousProjectId) {
      state.googleDrive.projectFolderId = previousProjectId;
      state.googleDrive.projectName = previousProjectName;
    }
  } catch (error) {
    console.error(error);
    state.googleDrive.lastStatus = `Duplicate failed: ${error.message}`;
    saveGoogleDriveStorageState();
    updateProjectSettingsStatus(state.googleDrive.lastStatus);
    setStatus("Duplicate failed", "dirty");
  }
}

async function downloadCapsanotoProjectBackup() {
  try {
    syncEditorToDocument();
    await prepareDocumentsForFolderMode({ rebuildPaths: true });
    const now = new Date().toISOString();
    const payload = {
      schemaVersion: 1,
      type: "capsanoto-project-backup",
      exportedAt: now,
      project: folderModeProjectPayload(),
      tcards: { schemaVersion: 1, updatedAt: now, blocks: state.blocks },
      filingManifest: filingManifest(),
      markdownFiles: state.documents.map((doc) => ({
        id: doc.id,
        path: doc.diskPath || suggestedMarkdownPath(doc),
        title: doc.title || doc.id,
        markdown: documentToCapsMarkdown(doc),
      })),
    };
    const name = `${safePathPart(state.writingRoomName || "Writing Room") || "Writing-Room"}.caps.json`;
    downloadFile(name, JSON.stringify(payload, null, 2), "application/json");
    setStatus("Downloaded Writing Room backup", "saved");
  } catch (error) {
    console.error(error);
    setStatus("Download backup failed", "dirty");
  }
}

function triggerProjectBackupImport() {
  if (!els.importProjectBackupInput) {
    setStatus("Import input unavailable", "dirty");
    return;
  }
  els.importProjectBackupInput.value = "";
  els.importProjectBackupInput.click();
}

async function importProjectBackupFromInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    await previewAndImportProjectBackup(payload, file.name || "Capsanoto backup");
  } catch (error) {
    console.error(error);
    setStatus("Import backup failed", "dirty");
    await openCapsDialog("Import Failed", [
      { html: `<p>Capsanoto could not import this file.</p><p><strong>Error:</strong> ${escapeHtml(error.message || "Unknown import error")}</p>` },
    ]).catch(() => null);
  } finally {
    event.target.value = "";
  }
}

function backupProjectPayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("The selected file is not a Capsanoto project backup.");
  if (payload.type === "capsanoto-project-backup" && payload.project) return payload.project;
  if (Array.isArray(payload.documents) || payload.writingRoomName) return payload;
  throw new Error("This JSON does not contain a Capsanoto Writing Room project.");
}

function backupTcardBlocks(payload, project) {
  if (payload?.tcards?.blocks && typeof payload.tcards.blocks === "object") return payload.tcards.blocks;
  if (payload?.blocks && typeof payload.blocks === "object") return payload.blocks;
  if (project?.blocks && typeof project.blocks === "object") return project.blocks;
  return {};
}

function backupMarkdownFiles(payload) {
  return Array.isArray(payload?.markdownFiles) ? payload.markdownFiles : [];
}

async function previewAndImportProjectBackup(payload, sourceName = "Capsanoto backup") {
  const project = backupProjectPayload(payload);
  const markdownFiles = backupMarkdownFiles(payload);
  const tcardBlocks = backupTcardBlocks(payload, project);
  const projectName = project.writingRoomName || payload.projectName || payload.name || "Imported Writing Room";
  const fileCount = markdownFiles.length || (Array.isArray(project.documents) ? project.documents.length : 0);
  const tcardCount = Object.keys(tcardBlocks).length;
  const exportedAt = payload.exportedAt || project.updatedAt || "unknown";
  const result = await openCapsDialog("Import Writing Room Backup", [
    { html: `<p>You are about to import <strong>${escapeHtml(projectName)}</strong> from <code>${escapeHtml(sourceName)}</code>.</p><ul><li>${fileCount} file${fileCount === 1 ? "" : "s"}</li><li>${tcardCount} TCard${tcardCount === 1 ? "" : "s"}</li><li>Exported: ${escapeHtml(exportedAt === "unknown" ? exportedAt : new Date(exportedAt).toLocaleString())}</li></ul><p>This replaces the current local Writing Room. It does not delete Google Drive or HDD backup files.</p>` },
    { name: "confirm", checkbox: true, label: "Replace the current local Writing Room with this imported backup.", footer: true },
  ]);
  if (result?.confirm !== "on") return;
  importProjectBackupPayload(payload);
}

function importProjectBackupPayload(payload) {
  const project = backupProjectPayload(payload);
  const markdownFiles = backupMarkdownFiles(payload);
  const importedDocs = [];
  const markdownById = new Map(markdownFiles.map((item) => [item.id || item.path || item.title, item]));
  if (markdownFiles.length) {
    markdownFiles.forEach((item, index) => {
      const fallback = {
        id: item.id || `doc-import-${Date.now()}-${index}`,
        title: item.title || item.path || `Imported File ${index + 1}`,
        diskPath: item.path || "",
      };
      const doc = capsMarkdownToDocument(item.markdown || "", fallback);
      doc.id = doc.id || fallback.id;
      doc.title = doc.title || fallback.title;
      doc.diskPath = doc.diskPath || fallback.diskPath;
      importedDocs.push(doc);
    });
  } else if (Array.isArray(project.documents)) {
    project.documents.forEach((item, index) => {
      const doc = { ...item };
      const markdownItem = markdownById.get(doc.id) || markdownById.get(doc.diskPath) || markdownById.get(doc.title);
      if (markdownItem?.markdown) Object.assign(doc, capsMarkdownToDocument(markdownItem.markdown, doc));
      if (!doc.id) doc.id = `doc-import-${Date.now()}-${index}`;
      if (!doc.title) doc.title = `Imported File ${index + 1}`;
      if (!doc.content) doc.content = `<h1>${escapeHtml(doc.title)}</h1><p>Imported file content was not included in this backup.</p>`;
      importedDocs.push(doc);
    });
  }
  state.writingRoomName = project.writingRoomName || payload.projectName || payload.name || "Imported Writing Room";
  state.documents = importedDocs;
  state.blocks = backupTcardBlocks(payload, project);
  state.filingGroups = Array.isArray(project.filingGroups) ? project.filingGroups : defaultFilingGroups();
  state.filingTabs = Array.isArray(project.filingTabs) ? project.filingTabs : [];
  state.trash = Array.isArray(project.trash) ? project.trash : [];
  state.deprecated = Array.isArray(project.deprecated) ? project.deprecated : [];
  state.deprecatedParagraphs = Array.isArray(project.deprecatedParagraphs) ? project.deprecatedParagraphs : [];
  if (project.designSettings && typeof project.designSettings === "object") {
    setProjectDesignSettings(project.designSettings, { persistLocal: true });
    applySavedDesignSettings();
    loadDesignForm();
  }
  normalizeFilingHierarchy();
  if (!state.documents.length) createDocument();
  state.activeId = project.activeId && state.documents.some((doc) => doc.id === project.activeId) ? project.activeId : state.documents[0].id;
  state.googleDrive.projectFolderId = "";
  state.googleDrive.projectName = "";
  state.googleDrive.lastSyncAt = "";
  state.googleDrive.lastStatus = state.googleDrive.accessToken ? "Imported backup locally. Use Create Online Project or Sync Now to upload it to Google Drive." : "Imported backup locally. Connect Google Account if you want to sync it online.";
  saveGoogleDriveStorageState();
  localStorage.setItem(STORAGE_KEY, serializedWorkspace());
  renderAll();
  updateUrl();
  updateProjectSettingsStatus(state.googleDrive.lastStatus);
  setStatus("Imported Writing Room backup", "saved");
}

function projectStoragePlaceholder(message) {
  setContextStatus(message, "saved", 2500);
  updateProjectSettingsStatus(message);
}

/* Folder Mode: local HDD Writing Room storage using the File System Access API. */
function folderModeSupported() {
  return Boolean(window.showDirectoryPicker);
}

function startFolderModeReminderLoop() {
  if (state.folderMode.reminderTimer) return;
  state.folderMode.reminderTimer = window.setInterval(checkFolderModeUnsavedChanges, FOLDER_MODE_CHECK_INTERVAL);
}

function folderModePrefs() {
  try { return JSON.parse(localStorage.getItem(FOLDER_MODE_PREF_KEY) || "{}"); }
  catch { return {}; }
}

function saveFolderModePrefs(prefs) {
  localStorage.setItem(FOLDER_MODE_PREF_KEY, JSON.stringify(prefs));
}

function resetFolderModeReminderPreference() {
  const prefs = folderModePrefs();
  prefs.hideUnsavedReminder = false;
  saveFolderModePrefs(prefs);
  updateFolderModeStatus("Ten-minute disk-save reminders reset");
  setStatus("Folder Mode reminder reset", "saved");
}

function updateFolderModeStatus(message = "") {
  if (!els.folderModeStatus) return;
  const supported = folderModeSupported();
  const mode = state.folderMode.enabled ? `Folder Mode active: ${escapeHtml(state.folderMode.projectName || "selected Writing Room folder")}` : "Folder Mode inactive";
  const support = supported ? "File System Access API available in this browser." : "File System Access API is not available in this browser. Use Chrome or Edge for Folder Mode.";
  const disk = state.folderMode.lastDiskSaveAt ? `Last disk save: ${new Date(state.folderMode.lastDiskSaveAt).toLocaleString()}` : "Last disk save: none yet";
  els.folderModeStatus.innerHTML = `<strong>${mode}</strong><br>${support}<br>${disk}${message ? `<br><span>${escapeHtml(message)}</span>` : ""}`;
  if (els.folderModeStructure) els.folderModeStructure.textContent = folderModeStructureText();
  updateProjectSettingsStatus();
}

function folderModeStructureText() {
  return [
    "Selected Writing Room folder/",
    "  capsanoto.project.json",
    "  tcards.json",
    "  assets/",
    "  Folder Name/",
    "    Tab Name/",
    "      File Title.md",
  ].join("\n");
}

async function restoreFolderModeHandle() {
  if (!folderModeSupported()) return;
  try {
    const handle = await readFolderModeHandle();
    if (!handle) return;
    const allowed = await verifyFilePermission(handle, false);
    state.folderMode.directoryHandle = handle;
    state.folderMode.enabled = Boolean(allowed);
    state.folderMode.projectName = handle.name || "Writing Room Folder";
  } catch (error) {
    console.warn("Could not restore Folder Mode handle", error);
  }
}

function openFolderModeDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FOLDER_MODE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(FOLDER_MODE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFolderModeHandle() {
  const db = await openFolderModeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDER_MODE_STORE, "readonly");
    const request = tx.objectStore(FOLDER_MODE_STORE).get(FOLDER_MODE_HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function storeFolderModeHandle(handle) {
  const db = await openFolderModeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDER_MODE_STORE, "readwrite");
    tx.objectStore(FOLDER_MODE_STORE).put(handle, FOLDER_MODE_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function verifyFilePermission(handle, readwrite = true) {
  const options = readwrite ? { mode: "readwrite" } : {};
  if ((await handle.queryPermission?.(options)) === "granted") return true;
  if ((await handle.requestPermission?.(options)) === "granted") return true;
  return false;
}

async function createNewWritingRoomFolder() {
  if (!folderModeSupported()) {
    setStatus("Folder Mode needs Chrome or Edge", "dirty");
    updateFolderModeStatus("Folder Mode is not supported in this browser.");
    return;
  }
  try {
    const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!(await verifyFilePermission(directoryHandle, true))) {
      setStatus("Folder permission was not granted", "dirty");
      return;
    }
    state.folderMode.directoryHandle = directoryHandle;
    state.folderMode.enabled = true;
    state.folderMode.projectName = directoryHandle.name || state.writingRoomName || "Writing Room";
    await storeFolderModeHandle(directoryHandle);
    await prepareDocumentsForFolderMode();
    await saveFolderModeSnapshot("Writing Room folder created", { force: true, writeAll: true });
    updateFolderModeStatus("Created project files and starter Markdown files.");
    setStatus("Writing Room folder created", "saved");
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error(error);
    setStatus("Could not create Writing Room folder", "dirty");
    updateFolderModeStatus(error.message || "Could not create Writing Room folder.");
  }
}

async function openWritingRoomFolder() {
  if (!folderModeSupported()) {
    setStatus("Folder Mode needs Chrome or Edge", "dirty");
    updateFolderModeStatus("Folder Mode is not supported in this browser.");
    return;
  }
  try {
    const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!(await verifyFilePermission(directoryHandle, true))) {
      setStatus("Folder permission was not granted", "dirty");
      return;
    }
    state.folderMode.directoryHandle = directoryHandle;
    state.folderMode.enabled = true;
    state.folderMode.projectName = directoryHandle.name || "Writing Room Folder";
    await storeFolderModeHandle(directoryHandle);
    await loadWritingRoomFromFolder(directoryHandle);
    localStorage.setItem(STORAGE_KEY, serializedWorkspace());
    renderAll();
    updateFolderModeStatus("Opened Writing Room folder from disk.");
    setStatus("Opened Writing Room folder", "saved");
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error(error);
    setStatus("Could not open Writing Room folder", "dirty");
    updateFolderModeStatus(error.message || "Could not open Writing Room folder.");
  }
}

async function loadWritingRoomFromFolder(directoryHandle) {
  const project = await readJsonFromDirectory(directoryHandle, "capsanoto.project.json");
  if (!project?.documents) {
    const create = confirm("This folder does not contain a Capsanoto project file. Create one here from the current Writing Room?");
    if (!create) return;
    await prepareDocumentsForFolderMode();
    await saveFolderModeSnapshot("Writing Room folder created", { force: true, writeAll: true });
    return;
  }
  state.writingRoomName = project.writingRoomName || directoryHandle.name || "Writing Room";
  state.filingGroups = Array.isArray(project.filingGroups) ? project.filingGroups : defaultFilingGroups();
  state.filingTabs = Array.isArray(project.filingTabs) ? project.filingTabs : [];
  state.trash = Array.isArray(project.trash) ? project.trash : [];
  state.deprecated = Array.isArray(project.deprecated) ? project.deprecated : [];
  state.deprecatedParagraphs = Array.isArray(project.deprecatedParagraphs) ? project.deprecatedParagraphs : [];
  if (project.designSettings && typeof project.designSettings === "object") {
    setProjectDesignSettings(project.designSettings, { persistLocal: true });
    applySavedDesignSettings();
    loadDesignForm();
  }
  state.documents = [];
  const tcardPayload = await readJsonFromDirectory(directoryHandle, "tcards.json").catch(() => null);
  state.blocks = tcardPayload?.blocks && typeof tcardPayload.blocks === "object" ? tcardPayload.blocks : (project.blocks || {});
  for (const docMeta of project.documents || []) {
    const doc = { ...docMeta };
    if (doc.diskPath) {
      try {
        const md = await readTextFileAtPath(directoryHandle, doc.diskPath);
        const parsed = capsMarkdownToDocument(md, doc);
        Object.assign(doc, parsed);
        doc.diskSavedAt = doc.diskSavedAt || new Date().toISOString();
      } catch (error) {
        console.warn(`Could not read ${doc.diskPath}`, error);
        doc.content = doc.content || `<h1>${escapeHtml(doc.title || "Missing File")}</h1><p>Capsanoto could not read this Markdown file from disk.</p>`;
      }
    }
    state.documents.push(doc);
  }
  normalizeFilingHierarchy();
  if (!state.documents.length) createDocument();
  state.activeId = project.activeId && state.documents.some((doc) => doc.id === project.activeId) ? project.activeId : state.documents[0].id;
  state.folderMode.lastDiskSaveAt = project.updatedAt || "";
}

async function prepareDocumentsForFolderMode(options = {}) {
  normalizeFilingHierarchy();
  const used = new Set();
  for (const doc of state.documents) {
    if (options.rebuildPaths || !doc.diskPath) doc.diskPath = suggestedMarkdownPath(doc, used);
    else used.add(doc.diskPath.toLowerCase());
  }
}

function suggestedMarkdownPath(doc, used = new Set()) {
  const tab = state.filingTabs.find((item) => item.id === doc.filingTabId);
  const group = state.filingGroups.find((item) => item.id === (tab?.groupId || doc.filingGroupId));
  const parts = [safePathPart(group?.label || "Writing Room"), safePathPart(tab?.label || "Tab number 1")];
  let base = safePathPart(doc.title || doc.id || "Untitled File") || "Untitled File";
  let path = `${parts.join("/")}/${base}.md`;
  let count = 2;
  while (used.has(path.toLowerCase())) path = `${parts.join("/")}/${base}-${count++}.md`;
  used.add(path.toLowerCase());
  return path;
}

function safePathPart(value) {
  return String(value || "Untitled")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Untitled";
}



async function checkLocalBackupStatus() {
  if (!state.folderMode.enabled || !state.folderMode.directoryHandle) {
    setStatus("Choose a backup folder first", "dirty");
    updateFolderModeStatus("Choose or open a backup folder before checking it.");
    updateProjectSettingsStatus();
    return;
  }
  try {
    setStatus("Checking backup folder…", "dirty");
    const project = await readJsonFromDirectory(state.folderMode.directoryHandle, "capsanoto.project.json");
    const tcardPayload = await readJsonFromDirectory(state.folderMode.directoryHandle, "tcards.json").catch(() => null);
    const backup = projectPayloadHealthSummary(project || {}, tcardPayload);
    const local = localProjectHealthSummary();
    const warnings = compareStorageSummaries(backup, local);
    const lines = [
      ...storageHealthLines("HDD backup", backup),
      ...storageHealthLines("Open Writing Room", local),
      warnings.length ? `Check: ${warnings.join("; ")}` : "Check: backup folder and the open Writing Room look aligned by counts.",
    ];
    const message = lines.join("\n");
    updateFolderModeStatus(message);
    updateProjectSettingsStatus(message);
    setStatus(warnings.length ? "Backup differences found" : "Backup status checked", warnings.length ? "dirty" : "saved");
  } catch (error) {
    console.error(error);
    updateFolderModeStatus(`Backup status check failed: ${error.message}`);
    updateProjectSettingsStatus(`Backup status check failed: ${error.message}`);
    setStatus("Backup status check failed", "dirty");
  }
}

async function syncLocalBackupFolder() {
  if (!state.folderMode.enabled || !state.folderMode.directoryHandle) {
    setStatus("Choose a backup folder first", "dirty");
    updateFolderModeStatus("Choose or open a backup folder before syncing.");
    updateProjectSettingsStatus();
    return;
  }
  try {
    await saveFolderModeSnapshot("Synced local backup folder", { force: true, writeAll: true });
    setStatus("Local backup folder synced", "saved");
    updateFolderModeStatus("Full Writing Room backup synced to disk.");
  } catch (error) {
    console.error(error);
    setStatus("Local backup sync failed", "dirty");
    updateFolderModeStatus(error.message || "Local backup sync failed.");
  }
}

async function saveFolderModeSnapshot(message = "Saved to disk", options = {}) {
  if (!state.folderMode.enabled || !state.folderMode.directoryHandle || state.folderMode.writeInProgress) return;
  state.folderMode.writeInProgress = true;
  try {
    const handle = state.folderMode.directoryHandle;
    if (!(await verifyFilePermission(handle, true))) throw new Error("Folder permission was not granted.");
    await prepareDocumentsForFolderMode({ rebuildPaths: Boolean(options.writeAll) });
    const active = activeDocument();
    const docsToWrite = options.writeAll ? state.documents : (active ? [active] : []);
    for (const doc of docsToWrite) await writeDocumentMarkdown(handle, doc);
    await writeJsonToDirectory(handle, "tcards.json", { schemaVersion: 1, updatedAt: new Date().toISOString(), blocks: state.blocks });
    await writeJsonToDirectory(handle, "filing-manifest.json", filingManifest());
    await writeJsonToDirectory(handle, "capsanoto.project.json", folderModeProjectPayload());
    const now = new Date().toISOString();
    docsToWrite.forEach((doc) => { doc.diskSavedAt = now; });
    state.folderMode.lastDiskSaveAt = now;
    localStorage.setItem(STORAGE_KEY, serializedWorkspace());
    setStatus(message || "Saved to disk", "saved");
    updateFolderModeStatus(message || "Saved to disk");
  } finally {
    state.folderMode.writeInProgress = false;
  }
}

function filingManifest() {
  normalizeFilingHierarchy();
  const folders = state.filingGroups.map((group, folderIndex) => ({
    id: group.id,
    label: group.label,
    type: group.type || "folder",
    order: folderIndex,
    locked: Boolean(group.locked),
    tabs: state.filingTabs
      .filter((tab) => tab.groupId === group.id)
      .map((tab, tabIndex) => ({
        id: tab.id,
        label: tab.label,
        type: tab.type || "tab",
        order: tabIndex,
        locked: Boolean(tab.locked),
        files: state.documents
          .filter((doc) => doc.filingTabId === tab.id)
          .map((doc, fileIndex) => ({
            id: doc.id,
            title: doc.title,
            type: documentType(doc),
            order: fileIndex,
            path: doc.diskPath || suggestedMarkdownPath(doc),
          })),
      })),
  }));
  return {
    hierarchyVersion: FILING_HIERARCHY_VERSION,
    writingRoomName: state.writingRoomName || "Writing Room",
    generatedAt: new Date().toISOString(),
    folders,
    trash: state.trash.map((doc, index) => ({ id: doc.id, title: doc.title, order: index, deletedAt: doc.deletedAt || "" })),
    deprecated: state.deprecated.map((doc, index) => ({ id: doc.id, title: doc.title, deprecatedOf: doc.deprecatedOf || "", order: index, deprecatedAt: doc.deprecatedAt || "" })),
  };
}

function folderModeProjectPayload() {
  return {
    schemaVersion: 4,
    hierarchyVersion: FILING_HIERARCHY_VERSION,
    storageMode: "folder-md",
    updatedAt: new Date().toISOString(),
    writingRoomName: state.writingRoomName,
    activeId: state.activeId,
    filingGroups: state.filingGroups,
    filingTabs: state.filingTabs,
    documents: state.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      tags: doc.tags || [],
      updatedAt: doc.updatedAt,
      filingGroupId: doc.filingGroupId,
      filingTabId: doc.filingTabId,
      diskPath: doc.diskPath || "",
      diskSavedAt: doc.diskSavedAt || "",
      localDraftAt: doc.localDraftAt || "",
      status: doc.status || "",
      style: doc.style || null,
    })),
    trash: state.trash,
    deprecated: state.deprecated,
    deprecatedParagraphs: state.deprecatedParagraphs || [],
    designSettings: currentDesignSettings(),
    folderModePrefs: folderModePrefs(),
    filingManifest: filingManifest(),
  };
}

function readDesignSettingsFromStorage() {
  return currentDesignSettings();
}

async function writeDocumentMarkdown(directoryHandle, doc) {
  if (!doc.diskPath) doc.diskPath = suggestedMarkdownPath(doc);
  const markdown = documentToCapsMarkdown(doc);
  await writeTextFileAtPath(directoryHandle, doc.diskPath, markdown);
}

async function getDirectoryAtPath(directoryHandle, parts, create = false) {
  let current = directoryHandle;
  for (const part of parts.filter(Boolean)) current = await current.getDirectoryHandle(part, { create });
  return current;
}

async function writeTextFileAtPath(directoryHandle, path, content) {
  const parts = path.split("/").filter(Boolean);
  const fileName = parts.pop();
  const folder = await getDirectoryAtPath(directoryHandle, parts, true);
  const fileHandle = await folder.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function readTextFileAtPath(directoryHandle, path) {
  const parts = path.split("/").filter(Boolean);
  const fileName = parts.pop();
  const folder = await getDirectoryAtPath(directoryHandle, parts, false);
  const fileHandle = await folder.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return file.text();
}

async function writeJsonToDirectory(directoryHandle, name, payload) {
  await writeTextFileAtPath(directoryHandle, name, JSON.stringify(payload, null, 2));
}

async function readJsonFromDirectory(directoryHandle, name) {
  const text = await readTextFileAtPath(directoryHandle, name);
  return JSON.parse(text);
}

function documentToCapsMarkdown(doc) {
  const frontMatter = {
    id: doc.id,
    title: doc.title || "Untitled File",
    tags: doc.tags || [],
    updatedAt: doc.updatedAt || new Date().toISOString(),
    filingGroupId: doc.filingGroupId || "",
    filingTabId: doc.filingTabId || "",
    diskPath: doc.diskPath || "",
  };
  return `---\n${yamlLike(frontMatter)}---\n\n${htmlToCapsMarkdown(doc.content || "")}`.trimEnd() + "\n";
}

function yamlLike(data) {
  return Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) return `${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    return `${key}: ${JSON.stringify(value ?? "")}`;
  }).join("\n") + "\n";
}

function capsMarkdownToDocument(markdown, fallback = {}) {
  const parsed = parseCapsFrontMatter(markdown);
  const meta = { ...fallback, ...parsed.meta };
  return {
    ...meta,
    tags: Array.isArray(meta.tags) ? meta.tags : (typeof meta.tags === "string" ? meta.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []),
    content: capsMarkdownToHtml(parsed.body || ""),
  };
}

function parseCapsFrontMatter(markdown) {
  const text = String(markdown || "");
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: text };
  const rawMeta = text.slice(4, end).trim();
  const body = text.slice(end + 4).replace(/^\s+/, "");
  const meta = {};
  rawMeta.split(/\n/).forEach((line) => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim();
    try { meta[key] = JSON.parse(value); }
    catch { meta[key] = value.replace(/^['"]|['"]$/g, ""); }
  });
  return { meta, body };
}

function htmlToCapsMarkdown(html) {
  const container = document.createElement("div");
  container.innerHTML = renderTransclusions(String(html || ""));
  container.querySelectorAll(".floating-edit-button").forEach((node) => node.remove());
  container.querySelectorAll(".transclusion-ref[data-block-id]").forEach((node) => node.replaceWith(document.createTextNode(`{{${node.dataset.blockId}}}`)));
  const lines = [];
  container.childNodes.forEach((node) => lines.push(nodeToCapsMarkdown(node)));
  return lines.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function nodeToCapsMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const tag = node.tagName.toLowerCase();
  const text = inlineMarkdown(node);
  if (tag === "h1") return `# ${text}`;
  if (tag === "h2") return `## ${text}`;
  if (tag === "h3") return `### ${text}`;
  if (tag === "p") return text;
  if (tag === "ul") return [...node.children].map((li) => `- ${inlineMarkdown(li)}`).join("\n");
  if (tag === "ol") return [...node.children].map((li, i) => `${i + 1}. ${inlineMarkdown(li)}`).join("\n");
  if (tag === "blockquote") return text.split(/\n/).map((line) => `> ${line}`).join("\n");
  if (tag === "hr") return "---";
  if (tag === "table" || node.classList.contains("emphasis-box")) return node.outerHTML;
  return node.outerHTML || text;
}

function inlineMarkdown(node) {
  return [...node.childNodes].map((child) => {
    if (child.nodeType === Node.TEXT_NODE) return child.textContent;
    if (child.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = child.tagName.toLowerCase();
    const text = inlineMarkdown(child);
    if (tag === "strong" || tag === "b") return `**${text}**`;
    if (tag === "em" || tag === "i") return `*${text}*`;
    if (tag === "code") return `\`${text}\``;
    if (tag === "a") return `[${text}](${child.getAttribute("href") || child.dataset.linkTarget || "#"})`;
    if (tag === "br") return "\n";
    return child.outerHTML || text;
  }).join("").trim();
}

function capsMarkdownToHtml(markdown) {
  const text = String(markdown || "").trim();
  if (!text) return "";
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block) => {
    if (/^<\w[\s\S]*>$/.test(block.trim())) return block.trim();
    if (/^###\s+/.test(block)) return `<h3>${inlineCapsMarkdownToHtml(block.replace(/^###\s+/, ""))}</h3>`;
    if (/^##\s+/.test(block)) return `<h2>${inlineCapsMarkdownToHtml(block.replace(/^##\s+/, ""))}</h2>`;
    if (/^#\s+/.test(block)) return `<h1>${inlineCapsMarkdownToHtml(block.replace(/^#\s+/, ""))}</h1>`;
    if (/^---$/.test(block.trim())) return "<hr>";
    if (/^-\s+/m.test(block)) return `<ul>${block.split(/\n/).map((line) => `<li>${inlineCapsMarkdownToHtml(line.replace(/^-\s+/, ""))}</li>`).join("")}</ul>`;
    return `<p>${inlineCapsMarkdownToHtml(block).replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
}

function inlineCapsMarkdownToHtml(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" data-link-target="$2">$1</a>');
}

function hasUnsavedDiskChanges(doc = activeDocument()) {
  if (!state.folderMode.enabled || !doc) return false;
  if (!doc.diskSavedAt) return Boolean(doc.localDraftAt || doc.updatedAt);
  const localTime = Date.parse(doc.localDraftAt || doc.updatedAt || 0);
  const diskTime = Date.parse(doc.diskSavedAt || 0);
  return localTime > diskTime + 1000;
}

async function checkFolderModeUnsavedChanges() {
  if (!state.folderMode.enabled || folderModePrefs().hideUnsavedReminder || state.folderMode.reminderOpen) return;
  const doc = activeDocument();
  if (!hasUnsavedDiskChanges(doc)) return;
  showFolderModeReminder(doc);
}

function showFolderModeReminder(doc) {
  state.folderMode.reminderOpen = true;
  const toast = document.createElement("div");
  toast.className = "folder-mode-toast";
  toast.innerHTML = `<strong>Unsaved disk changes</strong><p>Local backup is newer than the HDD file for <em>${escapeHtml(doc.title || doc.id)}</em>.</p><small>Local: ${escapeHtml(new Date(doc.localDraftAt || doc.updatedAt).toLocaleString())}<br>Disk: ${escapeHtml(doc.diskSavedAt ? new Date(doc.diskSavedAt).toLocaleString() : "never")}</small><div><button data-folder-toast="save">Save now</button><button data-folder-toast="later">Not yet</button><button data-folder-toast="hide">Don’t show this again</button></div>`;
  document.body.appendChild(toast);
  toast.addEventListener("click", async (event) => {
    const action = event.target.closest("button")?.dataset.folderToast;
    if (!action) return;
    if (action === "save") await saveFolderModeSnapshot("Saved to disk", { force: true });
    if (action === "hide") { const prefs = folderModePrefs(); prefs.hideUnsavedReminder = true; saveFolderModePrefs(prefs); }
    toast.remove();
    state.folderMode.reminderOpen = false;
  });
}

async function promptForLocalDiskMismatch(documentId) {
  const doc = state.documents.find((item) => item.id === documentId);
  if (!hasUnsavedDiskChanges(doc) || state.folderMode.reminderOpen) return;
  const result = await openCapsDialog("Local draft is newer", [
    { html: `<p>The local backup for <strong>${escapeHtml(doc.title || doc.id)}</strong> is newer than the HDD file.</p><p>Local: ${escapeHtml(new Date(doc.localDraftAt || doc.updatedAt).toLocaleString())}<br>Disk: ${escapeHtml(doc.diskSavedAt ? new Date(doc.diskSavedAt).toLocaleString() : "never")}</p><p>Click Apply to save the local draft to disk now, or close this dialog to keep editing locally.</p>` },
  ]);
  if (result) await saveFolderModeSnapshot("Saved local draft to disk", { force: true });
}

function renderExportSourceSelect() {
  if (!els.exportSourceSelect) return;
  const type = els.exportSourceType.value;
  const sources = type === "block"
    ? Object.values(state.blocks).map((block) => ({ id: block.id, label: block.id }))
    : state.documents.map((doc) => ({ id: doc.id, label: doc.title }));
  els.exportSourceSelect.innerHTML = sources.map((source) => `<option value="${escapeAttr(source.id)}">${escapeHtml(source.label)}</option>`).join("");
}

function addExportItem() {
  const type = els.exportSourceType.value;
  const id = els.exportSourceSelect.value;
  if (!id) return;
  state.exportItems.push({ type, id });
  renderExportQueue();
}

function renderExportQueue() {
  if (!els.exportQueue) return;
  els.exportQueue.innerHTML = state.exportItems.length ? state.exportItems.map((item, index) => {
    const label = item.type === "block" ? item.id : (state.documents.find((doc) => doc.id === item.id)?.title || item.id);
    return `<div class="export-pill" draggable="true" data-export-index="${index}"><span>${escapeHtml(item.type === "block" ? "▣" : "📄")} ${escapeHtml(label)}</span><button type="button" data-remove-export="${index}" aria-label="Remove ${escapeAttr(label)}">×</button></div>`;
  }).join("") : `<p class="panel-help">No download pieces selected yet.</p>`;
}

function handleExportDragStart(event) {
  const pill = event.target.closest(".export-pill");
  if (!pill) return;
  state.draggedExportIndex = Number(pill.dataset.exportIndex);
}

function handleExportDragOver(event) {
  if (event.target.closest(".export-pill")) event.preventDefault();
}

function handleExportDrop(event) {
  const pill = event.target.closest(".export-pill");
  if (!pill || state.draggedExportIndex === null) return;
  event.preventDefault();
  const targetIndex = Number(pill.dataset.exportIndex);
  const [item] = state.exportItems.splice(state.draggedExportIndex, 1);
  state.exportItems.splice(targetIndex, 0, item);
  state.draggedExportIndex = null;
  renderExportQueue();
}

function handleExportQueueClick(event) {
  const button = event.target.closest("button[data-remove-export]");
  if (!button) return;
  state.exportItems.splice(Number(button.dataset.removeExport), 1);
  renderExportQueue();
}

function exportSmartBundle(format) {
  const items = state.exportItems.length ? state.exportItems : [{ type: "document", id: activeDocument().id }];
  const pieces = items.map(resolveExportPiece).filter(Boolean);
  const baseName = `capsanoto-${new Date().toISOString().slice(0, 10)}`;
  if (format === "caps") {
    downloadFile(`${baseName}.caps.json`, JSON.stringify({ schemaVersion: 1, type: "caps-file", createdAt: new Date().toISOString(), pieces }, null, 2), "application/json");
  } else if (format === "txt") {
    downloadFile(`${baseName}.txt`, pieces.map((piece) => `${piece.title}\n${textFromHtml(piece.html)}`).join("\n\n---\n\n"), "text/plain");
  } else {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(baseName)}</title></head><body>${pieces.map((piece) => `<section data-caps-type="${piece.type}" data-caps-id="${escapeAttr(piece.id)}"><h1>${escapeHtml(piece.title)}</h1>${piece.html}</section>`).join("\n")}</body></html>`;
    downloadFile(`${baseName}.${format === "doc" ? "doc" : "html"}`, html, format === "doc" ? "application/msword" : "text/html");
  }
  setStatus(`Downloaded ${format.toUpperCase()}`, "saved");
}

function resolveExportPiece(item) {
  if (item.type === "block") {
    const block = state.blocks[item.id];
    return block ? { type: "block", id: block.id, title: block.id, html: `<p>${sanitizeBlockContent(block.content)}</p>` } : null;
  }
  const doc = state.documents.find((entry) => entry.id === item.id);
  return doc ? { type: "document", id: doc.id, title: doc.title, html: renderTransclusions(doc.content) } : null;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function textFromHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

function bindDesignToggle(button, input) {
  if (!button || !input) return;
  button.addEventListener("click", () => {
    input.checked = !input.checked;
    button.setAttribute("aria-pressed", String(input.checked));
  });
}

function bindDesignColorTools() {
  renderFavoriteColors();
  const colorInputs = document.querySelectorAll(".design-section input[type='color']");
  colorInputs.forEach((input) => {
    input.draggable = true;
    input.addEventListener("focus", () => syncActiveColorInput(input));
    input.addEventListener("input", () => syncActiveColorInput(input));
    input.addEventListener("dragstart", (event) => event.dataTransfer?.setData("text/plain", input.value));
    if (!state.lastColorInput) state.lastColorInput = input;
  });
  els.activeColorHex?.addEventListener("input", () => applyHexToActiveColor(els.activeColorHex.value));
  els.currentColorBox?.addEventListener("dragstart", (event) => event.dataTransfer?.setData("text/plain", els.currentColorBox.dataset.currentColor || els.activeColorHex?.value || ""));
  els.favoriteColors?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-favorite-color]");
    if (!button) return;
    applyHexToActiveColor(button.dataset.favoriteColor);
  });
  els.favoriteColors?.addEventListener("dragstart", (event) => {
    const button = event.target.closest("button[data-favorite-color]");
    if (button) event.dataTransfer?.setData("text/plain", button.dataset.favoriteColor);
  });
  els.favoriteColors?.addEventListener("dragover", (event) => {
    if (event.target.closest("button[data-favorite-index]")) event.preventDefault();
  });
  els.favoriteColors?.addEventListener("drop", handleFavoriteColorDrop);
}

function setElementDesignerCards(open) {
  document.querySelectorAll(".element-designer-card").forEach((card) => { card.open = open; });
}

function bindElementDesignerCardScroll() {
  document.querySelectorAll(".element-designer-card").forEach((card) => {
    card.addEventListener("toggle", () => {
      if (!card.open) return;
      setTimeout(() => card.scrollIntoView({ block: "start", behavior: "smooth" }), 40);
    });
  });
}

function showColorReferenceImage(event) {
  const file = event.target.files?.[0];
  if (!file || !els.colorImagePreview || !els.colorImagePopup) return;
  const reader = new FileReader();
  reader.onload = () => {
    els.colorImagePreview.src = String(reader.result || "");
    els.colorImagePopup.hidden = false;
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

let settingsSearchMatches = [];
let settingsSearchIndex = -1;

function handleSettingsSearchInput() {
  const query = (els.settingsSearchInput?.value || "").trim().toLowerCase();
  clearSettingsSearchMarks();
  settingsSearchMatches = [];
  settingsSearchIndex = -1;
  if (!query) {
    updateSettingsSearchCount();
    return;
  }
  const candidates = Array.from(els.settingsPanel.querySelectorAll("summary, label, h3, h4, p, button"))
    .filter((node) => node.offsetParent !== null && node.textContent.toLowerCase().includes(query));
  settingsSearchMatches = candidates;
  candidates.forEach((node) => node.classList.add("setting-search-match"));
  if (settingsSearchMatches.length) moveSettingsSearch(1);
  else updateSettingsSearchCount();
}

function clearSettingsSearchMarks() {
  els.settingsPanel?.querySelectorAll(".setting-search-match, .setting-search-current").forEach((node) => {
    node.classList.remove("setting-search-match", "setting-search-current");
  });
  updateSettingsSearchCount();
}

function updateSettingsSearchCount() {
  if (!els.settingsSearchCount) return;
  const total = settingsSearchMatches.length;
  const current = total ? settingsSearchIndex + 1 : 0;
  els.settingsSearchCount.textContent = `${current} / ${total}`;
}

function moveSettingsSearch(direction) {
  if (!settingsSearchMatches.length) {
    updateSettingsSearchCount();
    return;
  }
  settingsSearchMatches.forEach((node) => node.classList.remove("setting-search-current"));
  settingsSearchIndex = (settingsSearchIndex + direction + settingsSearchMatches.length) % settingsSearchMatches.length;
  const node = settingsSearchMatches[settingsSearchIndex];
  node.classList.add("setting-search-current");
  node.closest("details")?.setAttribute("open", "");
  node.scrollIntoView({ block: "center", behavior: "smooth" });
  updateSettingsSearchCount();
}

function renderFavoriteColors() {
  if (!els.favoriteColors) return;
  els.favoriteColors.innerHTML = state.favoriteColors.map((color, index) => (
    `<button type="button" draggable="true" data-favorite-index="${index}" data-favorite-color="${escapeAttr(color)}" aria-label="Use ${escapeAttr(color)}" style="--favorite-color:${escapeAttr(color)}">${escapeHtml(color)}</button>`
  )).join("");
}

function handleFavoriteColorDrop(event) {
  const button = event.target.closest("button[data-favorite-index]");
  if (!button) return;
  event.preventDefault();
  const color = normalizeHexColor(event.dataTransfer?.getData("text/plain") || state.lastColorInput?.value || "");
  if (!color) return;
  state.favoriteColors[Number(button.dataset.favoriteIndex)] = color;
  renderFavoriteColors();
  setStatus("Favorite color updated", "saved");
}

function syncActiveColorInput(input) {
  if (!input) return;
  state.lastColorInput = input;
  if (els.activeColorHex) els.activeColorHex.value = input.value;
  updateCurrentColorBox(input.value);
}

function updateCurrentColorBox(value) {
  const color = normalizeHexColor(value);
  if (!color || !els.currentColorBox) return;
  els.currentColorBox.textContent = color;
  els.currentColorBox.dataset.currentColor = color;
  els.currentColorBox.style.setProperty("--current-color", color);
}

function applyHexToActiveColor(value) {
  const color = normalizeHexColor(value);
  if (!color || !state.lastColorInput) return;
  state.lastColorInput.value = color;
  state.lastColorInput.dispatchEvent(new Event("input", { bubbles: true }));
  syncActiveColorInput(state.lastColorInput);
}

function normalizeHexColor(value) {
  const raw = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.slice(1).split("").map((char) => char + char).join("")}`.toLowerCase();
  }
  return "";
}


function extraDesignInputs() {
  return Array.from(document.querySelectorAll("[data-design-key]"));
}

function applyTopCommandIconSettings(settings) {
  loadCustomEmojis();
  const defaults = {
    topIconWritingRoom: "📚",
    topIconFormat: "🪶",
    topIconInsert: "🗡️",
    topIconSubnoto: "📜",
    topIconSpecnoto: "🕯️",
    topIconHelp: "🗿",
    topIconSettings: "🗝️",
  };
  const labelDefaults = {
    topIconWritingRoom: ["topLabelWritingRoom", "Writing Room"],
    topIconFormat: ["topLabelFormat", "Format"],
    topIconInsert: ["topLabelInsert", "Insert"],
    topIconSubnoto: ["topLabelSubnoto", "Subnoto"],
    topIconSpecnoto: ["topLabelSpecnoto", "Specnoto"],
    topIconHelp: ["topLabelHelp", "Help"],
    topIconSettings: ["topLabelSettings", "Settings"],
  };
  Object.entries(defaults).forEach(([key, fallback]) => {
    const button = document.querySelector(`[data-icon-key="${key}"]`);
    const glyph = button?.querySelector(".command-glyph");
    if (glyph) glyph.innerHTML = iconMarkupFromValue(settings[key] || fallback, fallback);
    const [labelKey, labelFallback] = labelDefaults[key] || [];
    const labelText = String(settings[labelKey] || labelFallback || "").trim();
    const label = button?.querySelector(".command-label");
    if (label && labelText) label.textContent = labelText;
    if (button && labelText) {
      button.setAttribute("aria-label", labelText);
      button.setAttribute("title", labelText);
      if (!button.dataset.toolName || ["Writing Room", "Format tools", "Insert tools", "Subnoto clipboard", "Specnoto search/find placeholder", "Help / Guidebook", "Capsanoto Settings"].includes(button.dataset.toolName)) {
        button.dataset.toolName = labelText;
      }
    }
  });
}

function refreshIconInputPreviews() {
  loadCustomEmojis();
  document.querySelectorAll(".icon-text-input").forEach((input) => {
    let preview = input.parentElement?.querySelector(".icon-input-preview");
    if (!preview) {
      preview = document.createElement("span");
      preview.className = "icon-input-preview";
      input.insertAdjacentElement("afterend", preview);
    }
    preview.innerHTML = iconMarkupFromValue(input.value || "□", "□");
  });
}

function extraDesignDefaults() {
  const defaults = {};
  extraDesignInputs().forEach((input) => {
    defaults[input.dataset.designKey] = input.type === "checkbox" ? input.checked : input.value;
  });
  document.querySelectorAll("[data-inherit-section]").forEach((input) => {
    defaults[`inherit_${input.dataset.inheritSection}`] = input.checked;
  });
  return defaults;
}

function applyExtraDesignSettings(settings) {
  const root = document.documentElement;
  extraDesignInputs().forEach((input) => {
    const key = input.dataset.designKey;
    const value = settings[key] ?? input.value;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value;
    if (input.dataset.cssVar && value !== undefined && value !== "") {
      const suffix = input.dataset.suffix || "";
      let cssValue = String(value);
      if (input.type === "checkbox" && (input.dataset.trueValue || input.dataset.falseValue)) {
        cssValue = input.checked ? (input.dataset.trueValue || "1") : (input.dataset.falseValue || "0");
      } else if (input.dataset.cssUrl === "true" || input.dataset.cssVar === "--top-bar-image-url") {
        cssValue = value ? `url("${escapeCssUrl(value)}")` : "none";
      } else if (input.dataset.cssVar && input.dataset.cssVar.toLowerCase().includes("opacity")) {
        const pct = Math.max(0, Math.min(100, Number(value) || 0));
        cssValue = String(pct / 100);
      } else if (suffix && !String(value).endsWith(suffix)) {
        cssValue = `${value}${suffix}`;
      }
      root.style.setProperty(input.dataset.cssVar, cssValue);
    }
  });
  document.body.dataset.writingSurfaceLayout = settings.writingSurfaceLayout || "center";
  document.body.dataset.deskGlowFlip = settings.writingDeskGlowFlip ? "true" : "false";
  requestAnimationFrame(updateWritingAssistRailPosition);
  refreshIconInputPreviews();
  applyTopCommandIconSettings(settings);
  document.querySelectorAll("[data-inherit-section]").forEach((input) => {
    input.checked = Boolean(settings[`inherit_${input.dataset.inheritSection}`]);
    updateInheritedDesignerSection(input);
  });
}

function collectExtraDesignSettings(settings) {
  extraDesignInputs().forEach((input) => {
    settings[input.dataset.designKey] = input.type === "checkbox" ? input.checked : input.value;
  });
  document.querySelectorAll("[data-inherit-section]").forEach((input) => {
    settings[`inherit_${input.dataset.inheritSection}`] = input.checked;
  });
  return settings;
}

function updateInheritedDesignerSection(toggle) {
  const card = toggle.closest(".element-designer-card");
  if (!card) return;
  const inherited = toggle.checked;
  card.classList.toggle("uses-system-defaults", inherited);
  card.querySelectorAll("[data-inherit-target]").forEach((button) => button.setAttribute("aria-pressed", String(inherited)));
  card.querySelectorAll("input, select, textarea, button").forEach((control) => {
    if (control === toggle || control.closest("summary") || control.closest(".inherit-controls") || control.id === "expandDesignerCards" || control.id === "collapseDesignerCards" || control.id === "applyDesignButton" || control.id === "resetDesignButton") return;
    if (control.matches("[data-inherit-section], [data-inherit-target]")) return;
    control.disabled = inherited;
  });
}

function bindInheritanceToggles() {
  document.querySelectorAll("[data-inherit-section]").forEach((toggle) => {
    toggle.addEventListener("change", () => updateInheritedDesignerSection(toggle));
    const button = toggle.closest(".inherit-controls")?.querySelector("[data-inherit-target]");
    button?.addEventListener("click", () => {
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });
    updateInheritedDesignerSection(toggle);
  });
}

function loadDesignForm() {
  const settings = currentDesignSettings();
  state.favoriteColors = validFavoriteColors(settings.favoriteColors);
  renderFavoriteColors();
  els.designButtonBg.value = settings.buttonBg;
  els.designBorderColor.value = settings.borderColor;
  els.designTextColor.value = settings.textColor;
  els.designFontSize.value = settings.fontSize;
  if (els.designFontFamily) els.designFontFamily.value = settings.fontFamily;
  if (els.titleIconScale) els.titleIconScale.value = settings.titleIconScale;
  els.designBold.checked = settings.bold;
  els.designBgImage.value = settings.bgImage;
  els.dialogBgColor.value = settings.dialogBg;
  els.dialogBorderColor.value = settings.dialogBorder;
  els.dialogShadowColor.value = settings.dialogShadow;
  els.dialogTextColor.value = settings.dialogText;
  els.dialogFontSize.value = settings.dialogFontSize;
  els.dialogBold.checked = settings.dialogBold;
  els.dialogButtonBg.value = settings.dialogButtonBg;
  els.dialogButtonBorder.value = settings.dialogButtonBorder;
  els.dialogButtonText.value = settings.dialogButtonText;
  els.dialogButtonShadow.value = settings.dialogButtonShadow;
  els.labelTextColor.value = settings.labelText;
  els.dynamicTextColor.value = settings.dynamicText;
  els.scrollbarTrackColor.value = settings.scrollbarTrack;
  els.scrollbarThumbColor.value = settings.scrollbarThumb;
  els.statusBgColor.value = settings.statusBg;
  els.statusBorderColor.value = settings.statusBorder;
  els.statusTextColor.value = settings.statusText;
  els.emphasisBgColor.value = settings.emphasisBg;
  els.emphasisBorderColor.value = settings.emphasisBorder;
  els.emphasisTextColor.value = settings.emphasisText;
  els.panelBgColor.value = settings.writingRoomBg || settings.panelBg;
  els.panelBorderColor.value = settings.panelBorder;
  els.designBoldToggle?.setAttribute("aria-pressed", String(settings.bold));
  els.dialogBoldToggle?.setAttribute("aria-pressed", String(settings.dialogBold));
  applyExtraDesignSettings(settings);
  syncActiveColorInput(els.designBorderColor);
}

function validFavoriteColors(colors) {
  const values = Array.isArray(colors) ? colors.map(normalizeHexColor).filter(Boolean) : [];
  return [...values, ...DEFAULT_FAVORITE_COLORS].slice(0, DEFAULT_FAVORITE_COLORS.length);
}

function designSettingsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(DESIGN_KEY) || "null") || {};
  } catch (error) {
    console.warn("Ignoring unreadable Capsanoto design settings", error);
    localStorage.removeItem(DESIGN_KEY);
    return {};
  }
}

function normalizedDesignSettings(settings = {}) {
  const defaults = { ...defaultDesignSettings(), ...extraDesignDefaults() };
  const incoming = settings && typeof settings === "object" ? settings : {};
  if (incoming.paletteVersion !== CAPSANOTO_THEME_VERSION) {
    const preserved = {};
    [
      "topIconWritingRoom", "topLabelWritingRoom", "topIconFormat", "topLabelFormat", "topIconInsert", "topLabelInsert",
      "topIconSubnoto", "topLabelSubnoto", "topIconSpecnoto", "topLabelSpecnoto", "topIconHelp", "topLabelHelp",
      "topIconSettings", "topLabelSettings", "titleIconScale", "fontFamily", "fontSize"
    ].forEach((key) => { if (incoming[key] !== undefined) preserved[key] = incoming[key]; });
    return { ...defaults, ...preserved, paletteVersion: CAPSANOTO_THEME_VERSION, favoriteColors: [...DEFAULT_FAVORITE_COLORS] };
  }
  return { ...defaults, ...incoming, paletteVersion: CAPSANOTO_THEME_VERSION };
}

function setProjectDesignSettings(settings = {}, options = {}) {
  const next = normalizedDesignSettings(settings);
  state.designSettings = next;
  if (options.persistLocal !== false) localStorage.setItem(DESIGN_KEY, JSON.stringify(next));
  return next;
}

function currentDesignSettings() {
  return normalizedDesignSettings({ ...state.designSettings, ...designSettingsFromStorage() });
}

function defaultDesignSettings() {
  const palette = CAPSANOTO_PALETTE;
  return {
    paletteVersion: CAPSANOTO_THEME_VERSION,
    pageBg: palette.espresso,
    paperBg: palette.espresso,
    darkBg: palette.espresso,
    dark2Bg: palette.umber,
    accentColor: palette.peach,
    accentSoft: "rgba(232, 143, 105, 0.18)",
    buttonHover: palette.amethyst,
    successColor: palette.amethyst,
    warningColor: palette.ochre,
    dangerColor: palette.ember,
    buttonBg: palette.umber,
    borderColor: palette.clay,
    textColor: palette.parchment,
    fontSize: "14",
    fontFamily: "Arial, Helvetica, sans-serif",
    titleIconScale: "143",
    bold: true,
    bgImage: "wallpapersm.jpg",
    dialogBg: palette.espresso,
    dialogBorder: palette.clay,
    dialogShadow: palette.black,
    dialogText: palette.parchment,
    dialogFontSize: "14",
    dialogBold: true,
    dialogButtonBg: palette.umber,
    dialogButtonBorder: palette.clay,
    dialogButtonText: palette.parchment,
    dialogButtonShadow: palette.black,
    labelText: palette.ochre,
    dynamicText: palette.peach,
    scrollbarTrack: palette.espresso,
    scrollbarThumb: palette.peach,
    statusBg: palette.espresso,
    statusBorder: palette.clay,
    statusText: palette.parchment,
    emphasisBg: palette.umber,
    emphasisBorder: palette.amethyst,
    emphasisText: palette.parchment,
    panelBg: palette.espresso,
    panelBorder: palette.clay,
    favoriteColors: [...DEFAULT_FAVORITE_COLORS],
  };
}

function saveDesignSettings() {
  const settings = collectExtraDesignSettings({ buttonBg: els.designButtonBg.value, borderColor: els.designBorderColor.value, textColor: els.designTextColor.value, fontSize: els.designFontSize.value || "14", fontFamily: els.designFontFamily?.value || "Arial, Helvetica, sans-serif", titleIconScale: els.titleIconScale?.value || "143", bold: els.designBold.checked, bgImage: els.designBgImage.value.trim(), dialogBg: els.dialogBgColor.value, dialogBorder: els.dialogBorderColor.value, dialogShadow: els.dialogShadowColor.value, dialogText: els.dialogTextColor.value, dialogFontSize: els.dialogFontSize.value || "14", dialogBold: els.dialogBold.checked, dialogButtonBg: els.dialogButtonBg.value, dialogButtonBorder: els.dialogButtonBorder.value, dialogButtonText: els.dialogButtonText.value, dialogButtonShadow: els.dialogButtonShadow.value, labelText: els.labelTextColor.value, dynamicText: els.dynamicTextColor.value, scrollbarTrack: els.scrollbarTrackColor.value, scrollbarThumb: els.scrollbarThumbColor.value, statusBg: els.statusBgColor.value, statusBorder: els.statusBorderColor.value, statusText: els.statusTextColor.value, emphasisBg: els.emphasisBgColor.value, emphasisBorder: els.emphasisBorderColor.value, emphasisText: els.emphasisTextColor.value, panelBg: currentDesignSettings().panelBg || defaultDesignSettings().panelBg, panelBorder: els.panelBorderColor.value, favoriteColors: [...state.favoriteColors] });
  settings.paletteVersion = CAPSANOTO_THEME_VERSION;
  localStorage.setItem(DESIGN_KEY, JSON.stringify(settings));
  applyDesignSettings(settings);
  setStatus("Design applied", "saved");
}

function resetDesignSettings() {
  const settings = setProjectDesignSettings(defaultDesignSettings(), { persistLocal: true });
  applyDesignSettings(settings);
  loadDesignForm();
  persistNow("Design reset and saved to Writing Room");
  updateProjectSettingsStatus();
}

function applySavedDesignSettings() {
  applyDesignSettings(currentDesignSettings());
}

function applyDesignSettings(settings) {
  settings = normalizedDesignSettings(settings);
  const root = document.documentElement;
  root.style.setProperty("--theme-bg-main", settings.pageBg);
  root.style.setProperty("--theme-bg-document", settings.paperBg);
  root.style.setProperty("--theme-panel", settings.panelBg || settings.darkBg);
  root.style.setProperty("--theme-panel-strong", settings.darkBg);
  root.style.setProperty("--theme-panel-soft", settings.dark2Bg);
  root.style.setProperty("--theme-accent", settings.accentColor);
  root.style.setProperty("--theme-accent-soft", settings.accentSoft);
  root.style.setProperty("--theme-button-hover", settings.buttonHover);
  root.style.setProperty("--theme-success", settings.successColor);
  root.style.setProperty("--theme-warning", settings.warningColor);
  root.style.setProperty("--theme-danger", settings.dangerColor);
  root.style.setProperty("--page", settings.pageBg);
  root.style.setProperty("--paper", settings.paperBg);
  root.style.setProperty("--dark", settings.darkBg);
  root.style.setProperty("--dark-2", settings.dark2Bg);
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--accent-soft", settings.accentSoft);
  root.style.setProperty("--button-hover", settings.buttonHover);
  root.style.setProperty("--success", settings.successColor);
  root.style.setProperty("--warning", settings.warningColor);
  root.style.setProperty("--danger", settings.dangerColor);
  root.style.setProperty("--button", settings.buttonBg);
  root.style.setProperty("--line", settings.borderColor);
  root.style.setProperty("--ink", settings.textColor);
  root.style.setProperty("--button-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--app-font-family", settings.fontFamily || "Arial, Helvetica, sans-serif");
  const iconScale = Math.max(50, Math.min(250, Number(settings.titleIconScale) || 143));
  root.style.setProperty("--title-icon-scale", `${iconScale}%`);
  root.style.setProperty("--title-icon-size", `${(1.65 * iconScale / 100).toFixed(2)}rem`);
  root.style.setProperty("--button-font-weight", settings.bold ? "800" : "500");
  root.style.setProperty("--app-bg-image", settings.bgImage ? `url("${escapeCssUrl(settings.bgImage)}")` : "none");
  root.style.setProperty("--dialog-bg", settings.dialogBg);
  root.style.setProperty("--dialog-border", settings.dialogBorder);
  root.style.setProperty("--dialog-shadow", settings.dialogShadow);
  root.style.setProperty("--dialog-text", settings.dialogText);
  root.style.setProperty("--dialog-font-size", `${settings.dialogFontSize}px`);
  root.style.setProperty("--dialog-font-weight", settings.dialogBold ? "800" : "500");
  root.style.setProperty("--dialog-button-bg", settings.dialogButtonBg);
  root.style.setProperty("--dialog-button-border", settings.dialogButtonBorder);
  root.style.setProperty("--dialog-button-text", settings.dialogButtonText);
  root.style.setProperty("--dialog-button-shadow", settings.dialogButtonShadow);
  root.style.setProperty("--label-text", settings.labelText);
  root.style.setProperty("--dynamic-text", settings.dynamicText);
  root.style.setProperty("--scrollbar-track", settings.scrollbarTrack);
  root.style.setProperty("--scrollbar-thumb", settings.scrollbarThumb);
  root.style.setProperty("--status-bg", settings.statusBg);
  root.style.setProperty("--status-border", settings.statusBorder);
  root.style.setProperty("--status-text", settings.statusText);
  root.style.setProperty("--emphasis-bg", settings.emphasisBg);
  root.style.setProperty("--emphasis-border", settings.emphasisBorder);
  root.style.setProperty("--emphasis-text", settings.emphasisText);
  root.style.setProperty("--panel-bg", settings.panelBg);
  root.style.setProperty("--panel-border", settings.panelBorder);
  root.style.setProperty("--writing-room-bg", settings.writingRoomBg || settings.panelBg || CAPSANOTO_PALETTE.espresso);
  applyExtraDesignSettings(settings);
}

function resetLocalWorkspace() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function exportWorkspace() {
  persistNow("Download prepared");
  const blob = new Blob([serializedWorkspace()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "documents.json";
  link.click();
  URL.revokeObjectURL(url);
}

function serializedWorkspace() {
  return JSON.stringify({
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    writingRoomName: state.writingRoomName,
    documents: state.documents,
    blocks: state.blocks,
    filingGroups: state.filingGroups,
    filingTabs: state.filingTabs,
    trash: state.trash,
    deprecated: state.deprecated,
    deprecatedParagraphs: state.deprecatedParagraphs || [],
    designSettings: currentDesignSettings(),
    favoriteColors: [...state.favoriteColors],
    customEmojis: [...state.customEmojis],
    favoriteEmojis: [...state.favoriteEmojis],
  }, null, 2);
}

function updateUrl(bookmarkId = "") {
  history.replaceState(null, "", documentUrl(activeDocument().id, bookmarkId));
}

function parseRoute() {
  const params = new URLSearchParams(location.search);
  return {
    documentId: params.get("doc") || "",
    bookmarkId: decodeURIComponent(location.hash.replace(/^#/, "")),
  };
}

function documentUrl(documentId, bookmarkId = "") {
  const url = new URL(location.href);
  url.pathname = editorPathname();
  url.search = "";
  url.searchParams.set("doc", documentId);
  url.hash = bookmarkId ? encodeURIComponent(bookmarkId) : "";
  return `${url.pathname}${url.search}${url.hash}`;
}

function editorPathname() {
  const segments = location.pathname.split("/");
  if (!segments[segments.length - 1] || segments[segments.length - 1].endsWith(".html")) {
    segments[segments.length - 1] = EDITOR_ENTRY;
  } else {
    segments.push(EDITOR_ENTRY);
  }
  return segments.join("/");
}

function sectionUrl(documentId, bookmarkId) {
  return documentUrl(documentId, bookmarkId);
}

function absoluteSectionUrl(documentId, bookmarkId) {
  return new URL(sectionUrl(documentId, bookmarkId), location.href).href;
}

function findDocumentByRouteId(value) {
  const decoded = decodeURIComponent(value);
  return state.documents.find((item) => item.id === decoded)
    ?? state.documents.find((item) => slugify(item.title) === slugify(decoded));
}

async function copyBookmarkLink(bookmarkId) {
  const url = absoluteSectionUrl(activeDocument().id, bookmarkId);
  await copyText(url);
  setStatus("Copied section link", "saved");
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function normalizeLinkTarget(value) {
  const raw = String(value || "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) {
    return { type: "external", target: raw, href: raw, label: raw };
  }

  const blockToken = raw.match(/^\{\{([A-Za-z]+-[A-Za-z0-9-]+)\}\}$/);
  const blockTarget = raw.startsWith("block:") ? raw.slice(6) : blockToken?.[1];
  if (blockTarget) {
    return { type: "block", target: blockTarget, href: `#block-${encodeURIComponent(blockTarget)}`, label: `Block: ${blockTarget}` };
  }

  if (raw.startsWith("#")) {
    const bookmark = raw.slice(1);
    return { type: "bookmark", target: bookmark, href: documentUrl(activeDocument().id, bookmark), label: `Bookmark: ${bookmark}` };
  }

  const localBookmark = findBookmarkId(raw);
  if (localBookmark) {
    return { type: "bookmark", target: localBookmark, href: documentUrl(activeDocument().id, localBookmark), label: `Bookmark: ${localBookmark}` };
  }

  const [docPart, bookmarkPart] = raw.split("#");
  const doc = findDocumentByRouteId(docPart);
  if (doc) {
    return bookmarkPart
      ? { type: "bookmark", target: bookmarkPart, href: documentUrl(doc.id, bookmarkPart), label: `${doc.title}#${bookmarkPart}` }
      : { type: "document", target: doc.id, href: documentUrl(doc.id), label: `Document: ${doc.title}` };
  }

  return { type: "external", target: raw, href: raw, label: raw };
}

function findBookmarkId(value) {
  const requested = slugify(value);
  const bookmark = getBookmarks().find((item) => item.id === value || slugify(item.id) === requested || slugify(item.label) === requested);
  return bookmark?.id || "";
}

function cssString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}


function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/(["\\.#:[\],>+~*^$()])/g, "\\$1");
}

function formatDateTime(value) {
  if (!value) return "unknown time";
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
}

function escapeCssUrl(value) {
  return String(value ?? "").replace(/["\\\n\r\f]/g, "");
}

function uniqueBookmarkId(base) {
  let id = base || "section";
  let index = 2;
  while (els.editor.querySelector(`#${CSS.escape(id)}`)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function humanizeDocumentId(value) {
  return decodeURIComponent(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

function sanitizeBlockContent(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function updateContextStatus() {
  if (!els.contextStatus || state.contextStatusLocked) return;
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    setContextStatus("···");
    return;
  }

  const range = selection.getRangeAt(0);
  if (!els.editor.contains(range.commonAncestorContainer)) {
    setContextStatus("···");
    return;
  }

  const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const parts = [];
  parts.push(selection.isCollapsed ? "Cursor" : `Selection: ${selection.toString().trim().length} chars`);

  const link = node?.closest?.("a");
  const block = node?.closest?.(".transclusion-ref");
  const heading = node?.closest?.("h1[id], h2[id], h3[id], [data-bookmark='true'][id]");
  const table = node?.closest?.("table");
  const list = node?.closest?.("ul, ol");
  const emphasis = node?.closest?.(".emphasis-box");

  if (emphasis) parts.push("emphasis box");
  if (block) parts.push(`inside TCard ${block.dataset.blockId || ""}`.trim());
  if (link) parts.push(link.classList.contains("pill-link") ? "Link Pill" : "link");
  if (heading) parts.push(`bookmark heading #${heading.id}`);
  if (table) parts.push("table");
  if (list) parts.push("list");
  if (!link && !block && !heading && !table && !list && !emphasis) parts.push("normal text");

  setContextStatus(parts.join(" · "));
}

function updateHoverStatus(event) {
  if (!els.contextStatus || state.contextStatusLocked) return;
  const target = event.target;
  const interactive = target.closest?.("button, select, input, textarea, summary, .tool-menu-trigger, #editor, .title-input");
  if (!interactive) return;
  if (interactive === els.titleInput) setContextStatus("Document title field");
  else if (interactive === els.tagsInput) setContextStatus("Document metadata tags");
  else if (interactive === els.documentSelect) setContextStatus("Current document selector");
  else if (interactive === els.newDocumentButton) setContextStatus("Create a new Writing Room document");
  else if (els.documentSettingsButton && interactive === els.documentSettingsButton) setContextStatus("Open Filing Cabinet settings for folders, tabs, and documents");
  else if (interactive === els.writingRoomButton) setContextStatus("Open Writing Room filing cabinet tabs");
  else if (interactive === els.projectSettingsButton) setContextStatus("Open Project Settings: online storage, backup folder, and sync controls");
  else if (interactive === els.settingsButton) setContextStatus("Open Writing Room settings");
  else if (interactive === els.topHelpButton || interactive === els.helpButton) setContextStatus("Open Help and release notes");
  else if (interactive === els.emphasisButton) setContextStatus("Wrap highlighted text in an emphasis box");
  else setContextStatus(interactive.dataset?.toolName || interactive.getAttribute?.("aria-label") || interactive.textContent.trim() || "Writing Room control");
}

function setContextStatus(message, lock = false, timeout = 0) {
  if (!els.contextStatus) return;
  clearTimeout(state.contextStatusTimer);
  state.contextStatusLocked = lock;
  els.contextStatus.textContent = message || "···";
  if (timeout) {
    state.contextStatusTimer = setTimeout(() => {
      state.contextStatusLocked = false;
      updateContextStatus();
    }, timeout);
  }
}

function setStatus(message, className) {
  els.saveStatus.textContent = "";
  els.saveStatus.className = `save-status ${className}`;
  if (className === "dirty") setContextStatus(`${message} …`, true);
  else if (className === "saved") setContextStatus(message, true, 1400);
  else setContextStatus(message, false);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
