import { createHash } from "node:crypto";
import { readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Expo's entry filename can stay unchanged when its lazy-chunk URLs change.
// Hash the final emitted bytes so immutable caches cannot retain an old manifest.
export function fingerprintWebEntry(distDir) {
  const bundleDir = join(distDir, "_expo/static/js/web");
  const entries = readdirSync(bundleDir).filter(name => /^entry-.*\.js$/.test(name));
  if (entries.length !== 1) throw new Error(`Expected one entry bundle, found ${entries.length}`);
  const oldName = entries[0];
  const source = readFileSync(join(bundleDir, oldName));
  const newName = `entry-${createHash("sha256").update(source).digest("hex")}.js`;
  const oldUrl = `/_expo/static/js/web/${oldName}`;
  const newUrl = `/_expo/static/js/web/${newName}`;
  let references = 0;
  function updateHtml(directory) {
    for (const file of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, file.name);
      if (file.isDirectory()) updateHtml(path);
      else if (file.name.endsWith(".html")) {
        const html = readFileSync(path, "utf8");
        if (!html.includes(oldUrl)) continue;
        references++;
        if (oldUrl !== newUrl) writeFileSync(path, html.replaceAll(oldUrl, newUrl));
      }
    }
  }
  updateHtml(distDir);
  if (!references) throw new Error("No HTML references the entry bundle");
  if (oldName !== newName) renameSync(join(bundleDir, oldName), join(bundleDir, newName));
  return newName;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(`Fingerprinted web entry: ${fingerprintWebEntry(resolve("dist"))}`);
}
