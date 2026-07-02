import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SOURCE_SVG = resolve(ROOT, "apps/desktop/resources/new-app-icon.svg");

const PURPLE = "#443f8f";

const srcSvg = readFileSync(SOURCE_SVG, "utf8");

function svgWithColor(hex) {
  return srcSvg.replaceAll(`fill="${PURPLE}"`, `fill="${hex}"`);
}

const purpleSvg = svgWithColor(PURPLE);
const whiteSvg = svgWithColor("#ffffff");
const blackSvg = svgWithColor("#000000");

async function writePng(svgString, outRel, size) {
  const outPath = resolve(ROOT, outRel);
  await sharp(Buffer.from(svgString), { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log("png", outRel, size);
}

function writeSvg(svgString, outRel) {
  const outPath = resolve(ROOT, outRel);
  writeFileSync(outPath, svgString);
  console.log("svg", outRel);
}

writeSvg(purpleSvg, "apps/web/public/logo-light.svg");
writeSvg(whiteSvg, "apps/web/public/logo-dark.svg");
writeSvg(purpleSvg, "apps/desktop/resources/logo-light.svg");
writeSvg(whiteSvg, "apps/desktop/resources/logo-dark.svg");

await writePng(purpleSvg, "apps/desktop/resources/icon.png", 16);
await writePng(purpleSvg, "apps/desktop/resources/icon@2x.png", 32);
await writePng(purpleSvg, "apps/desktop/resources/icon@3x.png", 64);

await writePng(blackSvg, "apps/desktop/resources/iconTemplate.png", 16);
await writePng(blackSvg, "apps/desktop/resources/iconTemplate@2x.png", 32);
await writePng(blackSvg, "apps/desktop/resources/iconTemplate@3x.png", 64);

await writePng(purpleSvg, "apps/desktop/resources/app-icon.png", 512);
await writePng(purpleSvg, "apps/web/public/app-icon.png", 512);

console.log("done");
