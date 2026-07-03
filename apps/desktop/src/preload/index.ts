import { contextBridge, ipcRenderer } from "electron";
import { setupRenderer } from "@better-auth/electron/preload";
import type { ElectronAPI, AppConfigPatch, BadgeUnlockPayload } from "../shared/ipc-types";

setupRenderer();

function onEvent<T extends unknown[]>(channel: string, callback: (...args: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
    callback(...(args as T));
  };
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const api: ElectronAPI = {
  // ─── Recording ──────────────────────────────────────────────────────
  recording: {
    notifyStarted: () => ipcRenderer.send("recording:started"),
    notifyStopped: () => ipcRenderer.send("recording:stopped"),
    onStart: (cb) => onEvent("recording:start", cb),
    onStop: (cb) => onEvent("recording:stop", cb),
    onCancelShortcut: (cb) => onEvent("recording:cancel-shortcut", cb),
    showWindow: () => ipcRenderer.send("recording:showWindow"),
    hideWindow: () => ipcRenderer.send("recording:hideWindow"),
    cancel: () => ipcRenderer.send("recording:cancel"),
    setIgnoreMouseEvents: (ignore) => ipcRenderer.send("recording:setIgnoreMouseEvents", ignore),
    toggle: () => ipcRenderer.send("recording:toggle"),
    onBadgeUnlock: (cb) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: BadgeUnlockPayload): void => {
        cb(payload);
      };
      ipcRenderer.on("pill:badge-unlock", handler);
      return () => {
        ipcRenderer.removeListener("pill:badge-unlock", handler);
      };
    },
    notifyCelebrationDone: () => ipcRenderer.send("pill:celebration-done"),
    onSkillApplying: (cb) => onEvent<[boolean]>("pill:skill-applying", cb),
    onViewLastDiff: (cb) => onEvent("shortcut:view-last-diff", cb),
  },

  // ─── Transcription ──────────────────────────────────────────────────
  transcription: {
    insert: (text) => ipcRenderer.invoke("transcription:insert", text),
    seedLastText: (text) => ipcRenderer.send("transcription:seed-last", text),
  },

  // ─── Config ─────────────────────────────────────────────────────────
  config: {
    get: () => ipcRenderer.invoke("config:get"),
    set: (patch: AppConfigPatch) => ipcRenderer.invoke("config:set", patch),
    reset: () => ipcRenderer.invoke("config:reset"),
    onCorrupt: (cb) => onEvent<[string]>("config:corrupt", cb),
  },

  // ─── Shortcuts ──────────────────────────────────────────────────────
  shortcuts: {
    get: () => ipcRenderer.invoke("shortcuts:get"),
    set: (key, accelerator) => ipcRenderer.invoke("shortcuts:set", key, accelerator),
    onChanged: (cb) => onEvent("shortcuts:changed", cb),
  },

  // ─── Dictionary ─────────────────────────────────────────────────────
  dictionary: {
    get: () => ipcRenderer.invoke("dictionary:get"),
    addWord: (word) => ipcRenderer.invoke("dictionary:addWord", word),
    removeWord: (id) => ipcRenderer.invoke("dictionary:removeWord", id),
    addSnippet: (trigger, expanded) =>
      ipcRenderer.invoke("dictionary:addSnippet", trigger, expanded),
    removeSnippet: (id) => ipcRenderer.invoke("dictionary:removeSnippet", id),
  },

  // ─── Skills ────────────────────────────────────────────────────────
  skills: {
    list: () => ipcRenderer.invoke("skills:list"),
    install: (id) => ipcRenderer.invoke("skills:install", id),
    uninstall: (id) => ipcRenderer.invoke("skills:uninstall", id),
    setShortcut: (skillId, accelerator) =>
      ipcRenderer.invoke("skills:setShortcut", skillId, accelerator),
  },

  // ─── Skill Builder ─────────────────────────────────────────────────
  skillBuilder: {
    build: (body) => ipcRenderer.invoke("skillBuilder:build", body),
    create: (body) => ipcRenderer.invoke("skillBuilder:create", body),
    update: (id, body) => ipcRenderer.invoke("skillBuilder:update", id, body),
    delete: (id) => ipcRenderer.invoke("skillBuilder:delete", id),
  },

  // ─── Session ────────────────────────────────────────────────────────
  session: {
    warmup: () => ipcRenderer.invoke("session:warmup"),
    transcribe: (input) => ipcRenderer.invoke("session:transcribe", input),
    onRewards: (cb) => onEvent("session:rewards", cb),
  },

  // ─── Action Mode ────────────────────────────────────────────────────
  actionMode: {
    execute: (input) => ipcRenderer.invoke("action-mode:execute", input),
    notifyStarted: () => ipcRenderer.send("action-mode:started"),
    cancel: () => ipcRenderer.send("action-mode:cancel"),
    onStart: (cb) => onEvent("action-mode:start", cb),
  },

  // ─── Suggestions ────────────────────────────────────────────────────
  suggestions: {
    getPending: () => ipcRenderer.invoke("suggestions:get-pending"),
    accept: (id: string) => ipcRenderer.invoke("suggestions:accept", id),
    reject: (id: string) => ipcRenderer.invoke("suggestions:reject", id),
  },

  // ─── Settings ───────────────────────────────────────────────────────
  settings: {
    show: () => ipcRenderer.send("settings:show"),
    hide: () => ipcRenderer.send("settings:hide"),
    getMicrophonePermission: () => ipcRenderer.invoke("settings:get-microphones"),
    checkMicrophoneStatus: () => ipcRenderer.invoke("settings:check-microphone-status"),
    checkAccessibility: (prompt) => ipcRenderer.invoke("settings:check-accessibility", prompt),
    getLaunchAtLogin: () => ipcRenderer.invoke("settings:get-launch-at-login"),
    setLaunchAtLogin: (enabled) => ipcRenderer.send("settings:set-launch-at-login", enabled),
    requestNotificationPermission: () =>
      ipcRenderer.invoke("settings:request-notification-permission"),
    checkNotificationSupport: () => ipcRenderer.invoke("settings:check-notification-support"),
    openMicrophonePrivacy: () => ipcRenderer.invoke("settings:open-microphone-privacy"),
  },

  // ─── App ────────────────────────────────────────────────────────────
  app: {
    version: () => ipcRenderer.invoke("app:version"),
    showMainWindow: () => ipcRenderer.send("app:showMainWindow"),
    openRoute: (route) => ipcRenderer.send("app:openRoute", route),
    onNavigate: (cb) => onEvent<[{ route: string }]>("app:navigate", cb),
  },

  // ─── Shell ──────────────────────────────────────────────────────────
  shell: {
    openExternal: (url) => ipcRenderer.send("shell:openExternal", url),
  },

  // ─── Clipboard ──────────────────────────────────────────────────────
  clipboard: {
    write: (text) => ipcRenderer.send("clipboard:write", text),
  },

  // ─── Debug ──────────────────────────────────────────────────────────
  debug: {
    log: (...args) => ipcRenderer.send("debug:log", ...args),
  },

  // ─── User ───────────────────────────────────────────────────────────
  user: {
    getSubscriptionStatus: () => ipcRenderer.invoke("user:getSubscriptionStatus"),
    getPlans: () => ipcRenderer.invoke("user:getPlans"),
  },

  // ─── Affiliate ──────────────────────────────────────────────────────
  affiliate: {
    getStatus: () => ipcRenderer.invoke("affiliate:getStatus"),
    getProfile: () => ipcRenderer.invoke("affiliate:getProfile"),
    getDashboard: () => ipcRenderer.invoke("affiliate:getDashboard"),
  },

  // ─── Usage (Heatmap) ────────────────────────────────────────────────
  usage: {
    getDaily: (query) => ipcRenderer.invoke("usage:getDaily", query),
    getStats: () => ipcRenderer.invoke("usage:getStats"),
    getShareCardStats: () => ipcRenderer.invoke("usage:getShareCardStats"),
  },

  // ─── Maintenance ──────────────────────────────────────────────────
  maintenance: {
    onCleanupExpiredAudio: (cb) => onEvent("maintenance:cleanup-expired-audio", cb),
  },

  interaction: {
    getMode: () => ipcRenderer.invoke("interaction:getMode"),
    setMode: (mode, owner) => ipcRenderer.invoke("interaction:setMode", mode, owner),
    clearMode: (owner) => ipcRenderer.invoke("interaction:clearMode", owner),
  },

  // ─── Feedback ──────────────────────────────────────────────────────
  feedback: {
    sendCleanupFeedback: (payload) => ipcRenderer.send("feedback:sendCleanupFeedback", payload),
  },

  // ─── Auth ──────────────────────────────────────────────────────────
  auth: {
    signOut: () => ipcRenderer.invoke("auth:signOut"),
    getSession: () => ipcRenderer.invoke("auth:getSession"),
    onDebug: (cb) => onEvent("auth:debug", cb),
    subscriptionUpgrade: (input) => ipcRenderer.invoke("auth:subscription-upgrade", input),
    subscriptionBillingPortal: () => ipcRenderer.invoke("auth:subscription-portal"),
    sendVerificationEmail: (input) => ipcRenderer.invoke("auth:send-verification-email", input),
    checkEmailStatus: (email) => ipcRenderer.invoke("auth:check-email-status", email),
    createCheckoutStatusToken: () => ipcRenderer.invoke("auth:checkout-status-token"),
    onPurchaseDeepLink: (cb) => onEvent("purchase:deep-link", cb),
    relayAuthToPill: () => ipcRenderer.send("auth:relay-to-pill"),
    onSessionChanged: (cb) => onEvent("auth:session-changed", cb),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type { ElectronAPI };
