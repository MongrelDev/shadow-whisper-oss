import { createRoot, type Root } from "react-dom/client";
import "./style.css";
import { PillShell } from "~/features/pill/components/pill-shell";
import { ShadowRootProvider } from "~/features/pill/lib/shadow-root-context";
import { patchTailwindPropertyRules } from "~/features/pill/lib/tailwind-property-patch";
import { PillPreferencesProvider } from "~/features/pill/providers/pill-preferences-provider";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: false,
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "shadow-whisper-pill",
      position: "inline",
      anchor: "body",
      mode: import.meta.env.VITE_E2E === "1" ? "open" : "closed",
      onMount: (container, shadow) => {
        patchTailwindPropertyRules(shadow);
        const root: Root = createRoot(container);
        root.render(
          <ShadowRootProvider shadowRoot={shadow}>
            <PillPreferencesProvider>
              <PillShell />
            </PillPreferencesProvider>
          </ShadowRootProvider>
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
