import type { ShowToast } from "~/features/pill/hooks/use-pill-toast";
import type { InsertResult } from "~/features/pill/lib/insert-text";
import { pasteShortcutLabel } from "~/features/pill/lib/platform";

export function handleInsertResult(result: InsertResult, showToast: ShowToast): void {
  if (result.ok) return;
  if (result.clipboardOk) {
    showToast(`Copiado — pressione ${pasteShortcutLabel()}`, "info");
  } else {
    showToast("Falha ao inserir e copiar", "error");
  }
}
