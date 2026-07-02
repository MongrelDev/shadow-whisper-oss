export const arrayBufferToDataUri = (audio: ArrayBuffer, contentType: string): string => {
  const base64 = Buffer.from(audio).toString("base64");
  return `data:${contentType};base64,${base64}`;
};
