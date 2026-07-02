const quote = (file) => `"${file}"`;
const list = (files) => files.map(quote).join(" ");
const workerTs = (files) =>
  files.filter((file) => file.startsWith("apps/worker/") && /\.(ts|tsx)$/.test(file));

// One invocation per file: the CLI takes a single --file and auto-detects the
// nearest tsconfig (which enables the @effect/language-service plugin). --strict
// makes warnings exit non-zero so the commit is blocked. Read-only — runs after
// eslint --fix / prettier so it sees the formatted source.
const effectDiagnostics = (files) =>
  files.map(
    (file) =>
      `node node_modules/@effect/language-service/cli.js diagnostics --file ${quote(file)} --severity error,warning --strict --format text`
  );

export default {
  "*.{ts,tsx}": (files) => {
    const effectFiles = workerTs(files);
    return [
      `pnpm exec eslint --fix ${list(files)}`,
      `pnpm exec prettier --write ${list(files)}`,
      ...effectDiagnostics(effectFiles),
    ];
  },
  "*.{js,jsx,mjs,cjs}": (files) => [
    `pnpm exec eslint --fix ${list(files)}`,
    `pnpm exec prettier --write ${list(files)}`,
  ],
  "*.{json,md,mdx,yml,yaml,css,html}": (files) => `pnpm exec prettier --write ${list(files)}`,
};
