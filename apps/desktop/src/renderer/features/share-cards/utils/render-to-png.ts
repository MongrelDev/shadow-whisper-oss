export async function renderToPng(element: HTMLElement, width?: number): Promise<Blob> {
  const { snapdom } = await import("@zumer/snapdom");
  const w = width ?? element.offsetWidth;
  return snapdom.toBlob(element, {
    width: w,
    scale: 2,
    type: "png",
    embedFonts: true,
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
