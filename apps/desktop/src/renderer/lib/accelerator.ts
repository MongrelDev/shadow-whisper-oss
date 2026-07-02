/**
 * Accelerator utilities for converting between Electron accelerator format
 * and display symbols, plus conflict detection for macOS shortcuts.
 */

/**
 * Converts Electron accelerator format to display symbols array.
 * @param accelerator - Electron accelerator string (e.g., "CommandOrControl+Shift+Alt+W")
 * @returns Array of display symbols (e.g., ["⌘", "⇧", "⌥", "W"])
 */
const ACCELERATOR_DISPLAY_SYMBOLS: Record<string, string> = {
  CommandOrControl: "⌘",
  Command: "⌘",
  Alt: "⌥",
  Option: "⌥",
  Shift: "⇧",
  Control: "⌃",
};

export function acceleratorToDisplay(accelerator: string): string[] {
  const parts = accelerator.split("+");
  return parts.map((part) => ACCELERATOR_DISPLAY_SYMBOLS[part] ?? part.toUpperCase());
}

/**
 * Converts display symbols array to Electron accelerator format.
 * @param keys - Array of display symbols (e.g., ["⌘", "⇧", "⌥", "W"])
 * @returns Electron accelerator string (e.g., "CommandOrControl+Shift+Alt+W")
 */
const DISPLAY_ACCELERATOR_SYMBOLS: Record<string, string> = {
  "⌘": "CommandOrControl",
  "⌥": "Alt",
  "⇧": "Shift",
  "⌃": "Control",
};

export function displayToAccelerator(keys: string[]): string {
  return keys.map((key) => DISPLAY_ACCELERATOR_SYMBOLS[key] ?? key).join("+");
}

/**
 * Known macOS shortcut conflicts with their descriptions.
 */
export const KNOWN_CONFLICTS: Record<string, string> = {
  "CommandOrControl+Alt+W": "Fecha todas as janelas do app atual",
  "CommandOrControl+Alt+H": "Oculta todos os outros apps",
  "CommandOrControl+Alt+M": "Minimiza todas as janelas",
  "CommandOrControl+Alt+Escape": "Forçar encerramento",
  "CommandOrControl+Alt+D": "Mostra/oculta Dock",
  "CommandOrControl+Alt+L": "Abre pasta Downloads",
  "CommandOrControl+Alt+Space": "Spotlight (Finder)",
  "CommandOrControl+Alt+F": "Ir para campo de busca",
  "CommandOrControl+Alt+T": "Mostra/oculta barra de ferramentas",
  "CommandOrControl+Alt+I": "Mostra/oculta inspetor",
  "CommandOrControl+Alt+C": "Copia formatação",
  "CommandOrControl+Alt+V": "Move (colar sem copiar)",
  "CommandOrControl+Space": "Spotlight",
  "CommandOrControl+Tab": "Alternar apps",
  "CommandOrControl+Q": "Encerrar app",
  "CommandOrControl+H": "Ocultar app",
  "CommandOrControl+M": "Minimizar",
  "CommandOrControl+W": "Fechar janela",
  "CommandOrControl+Shift+3": "Captura de tela completa",
  "CommandOrControl+Shift+4": "Captura de tela parcial",
  "CommandOrControl+Shift+5": "Ferramenta de captura",
};

/**
 * Checks if an accelerator conflicts with known macOS shortcuts.
 * @param accelerator - Electron accelerator string
 * @returns Conflict description if found, null otherwise
 */
export function checkConflict(accelerator: string): string | null {
  return KNOWN_CONFLICTS[accelerator] ?? null;
}
