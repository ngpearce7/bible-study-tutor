import { readFile } from "node:fs/promises";
import sharp from "sharp";

// One vector master for the in-app mark, browser icons, and native launchers.
const source = await readFile(new URL("../assets/brand-mark.svg", import.meta.url), "utf8");
const assets = new URL("../assets/", import.meta.url);
for (const [name, size] of [["brand-mark.png", 192], ["favicon.png", 48], ["apple-touch-icon.png", 180], ["icon.png", 1024]]) {
  // Native launchers apply their own corner masks and require opaque artwork.
  const svg = name === "icon.png" ? source.replace('rx="64"', 'rx="0"') : source;
  const image = sharp(Buffer.from(svg)).resize(size, size);
  if (name === "icon.png") image.removeAlpha();
  await image.png().toFile(new URL(name, assets).pathname);
}
// Android supplies the navy background and launcher mask. Keep the foreground
// inside the central safe zone so circle, squircle, and rounded masks all work.
const foreground = source.replace(/  <rect[^>]+\/>\n/, "")
  .replace("<path ", '<path transform="translate(32 32) scale(0.75)" ');
await sharp(Buffer.from(foreground)).resize(1024, 1024).png()
  .toFile(new URL("adaptive-icon.png", assets).pathname);
console.log("Generated brand mark and four app/browser icons from assets/brand-mark.svg");
