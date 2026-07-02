const patchedDocuments = new WeakSet<Document>();
const TW_PROPERTY_PREFIX = "@property --tw-";

export function patchTailwindPropertyRules(shadowRoot: ShadowRoot): void {
  const doc = shadowRoot.ownerDocument;
  if (patchedDocuments.has(doc)) return;
  if (!supportsConstructableStylesheets(doc)) return;

  const propertyRules = collectPropertyRules(shadowRoot);
  if (propertyRules.length === 0) return;

  applyToDocument(doc, propertyRules);
  patchedDocuments.add(doc);
}

function collectPropertyRules(shadowRoot: ShadowRoot): string[] {
  const out = new Set<string>();
  for (const sheet of shadowRoot.adoptedStyleSheets) {
    collectFromSheet(sheet, out);
  }
  for (const styleEl of shadowRoot.querySelectorAll("style")) {
    const sheet = (styleEl as HTMLStyleElement).sheet;
    if (sheet) collectFromSheet(sheet, out);
  }
  return [...out];
}

function applyToDocument(doc: Document, rules: string[]): void {
  const documentSheet = new CSSStyleSheet();
  for (const rule of rules) {
    try {
      documentSheet.insertRule(rule);
    } catch {
      // Ignore individual rule failures.
    }
  }
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, documentSheet];
}

function collectFromSheet(sheet: CSSStyleSheet, out: Set<string>): void {
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return;
  }
  for (const rule of rules) {
    if (rule.cssText.startsWith(TW_PROPERTY_PREFIX)) {
      out.add(rule.cssText);
    }
  }
}

function supportsConstructableStylesheets(doc: Document): boolean {
  return "adoptedStyleSheets" in doc && typeof CSSStyleSheet !== "undefined";
}
