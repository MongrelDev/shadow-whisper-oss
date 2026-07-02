let creating: Promise<void> | null = null;

export async function ensureOffscreenDocument(): Promise<void> {
  if (creating) {
    return creating;
  }

  const hasDoc = await checkHasOffscreenDocument();
  if (hasDoc) {
    return;
  }

  creating = chrome.offscreen
    .createDocument({
      url: chrome.runtime.getURL("offscreen.html"),
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: "Recording microphone audio for transcription",
    })
    .finally(() => {
      creating = null;
    });

  return creating;
}

export async function closeOffscreenDocument(): Promise<void> {
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // closeDocument throws when no document exists
  }
}

async function checkHasOffscreenDocument(): Promise<boolean> {
  if (chrome.offscreen.hasDocument) {
    return chrome.offscreen.hasDocument();
  }

  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  return contexts.length > 0;
}
