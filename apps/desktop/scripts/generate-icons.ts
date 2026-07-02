import sharp from "sharp";
import { join } from "node:path";

const resourcesDir = join(import.meta.dirname, "..", "resources");

const sizes = [
  { size: 16, suffix: "" },
  { size: 32, suffix: "@2x" },
  { size: 64, suffix: "@3x" },
];

async function main() {
  for (const { size, suffix } of sizes) {
    await sharp(join(resourcesDir, "logo-dark.svg"))
      .resize(size, size)
      .png()
      .toFile(join(resourcesDir, `iconTemplate${suffix}.png`));

    await sharp(join(resourcesDir, "logo-light.svg"))
      .resize(size, size)
      .png()
      .toFile(join(resourcesDir, `icon${suffix}.png`));
  }

  // High-res app icon (used for window icon, dock, taskbar)
  await sharp(join(resourcesDir, "logo-light.svg"))
    .resize(512, 512)
    .png()
    .toFile(join(resourcesDir, "app-icon.png"));

  console.log("Icons generated: icon/iconTemplate at 16, 32, 64 + app-icon 512");
}

main();
