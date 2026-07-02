import { getMainWindow } from "../windows/main";

interface ScheduledTask {
  name: string;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

const tasks: ScheduledTask[] = [];

function requestMainWindowAudioCleanup(): void {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("maintenance:cleanup-expired-audio");
}

function scheduleTask(name: string, intervalMs: number, run: () => void): void {
  const timer = setInterval(run, intervalMs);
  tasks.push({ name, intervalMs, timer });
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function startBackgroundTasks(): void {
  scheduleTask("audio-cleanup", ONE_DAY, () => {
    requestMainWindowAudioCleanup();
  });
}

export function stopBackgroundTasks(): void {
  for (const task of tasks) {
    if (task.timer) clearInterval(task.timer);
  }
  tasks.length = 0;
}
