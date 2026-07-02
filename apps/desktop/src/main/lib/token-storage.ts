import { app, safeStorage } from "electron";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

function tokenPath(): string {
  return join(app.getPath("userData"), "auth-token.dat");
}

export function getToken(): string | null {
  const path = tokenPath();
  if (!existsSync(path)) return null;
  try {
    const stored = readFileSync(path, "utf-8");
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(stored, "base64"));
    }
    return stored;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  const path = tokenPath();
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(token);
    writeFileSync(path, encrypted.toString("base64"), "utf-8");
  } else {
    writeFileSync(path, token, "utf-8");
  }
}

export function removeToken(): void {
  const path = tokenPath();
  if (existsSync(path)) unlinkSync(path);
}
