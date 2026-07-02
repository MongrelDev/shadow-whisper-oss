document.getElementById("grant")!.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    await chrome.storage.local.set({ sw_mic_permission_granted: true });
    window.close();
  } catch (err) {
    const errorEl = document.getElementById("error")!;
    errorEl.textContent = err instanceof Error ? err.name : String(err);
  }
});
