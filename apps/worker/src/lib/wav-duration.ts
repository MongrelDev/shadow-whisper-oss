const RIFF = 0x52494646; // "RIFF"
const WAVE = 0x57415645; // "WAVE"
const DATA = 0x64617461; // "data"

/**
 * Duration in seconds of a PCM/float WAV, derived from its byteRate and data
 * chunk size. Engine-independent — used to recover audio duration when the STT
 * provider does not report it (e.g. gpt-4o-transcribe). Returns 0 if the bytes
 * are not a parseable WAV.
 */
function findDataChunkSize(view: DataView, byteLength: number): number | null {
  let offset = 12;
  while (offset + 8 <= byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === DATA) return chunkSize;
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return null;
}

export function wavDurationSeconds(audio: ArrayBuffer): number {
  if (audio.byteLength < 44) return 0;
  const view = new DataView(audio);

  if (view.getUint32(0, false) !== RIFF || view.getUint32(8, false) !== WAVE) {
    return 0;
  }

  const byteRate = view.getUint32(28, true);
  if (byteRate <= 0) return 0;

  const dataSize = findDataChunkSize(view, audio.byteLength);
  return dataSize === null ? 0 : dataSize / byteRate;
}
