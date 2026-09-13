import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprintWebEntry } from "./fingerprint-web-entry.mjs";

test("a changed lazy-chunk URL changes the public entry URL even when Expo reuses its filename", () => {
  const root = mkdtempSync(join(tmpdir(), "reader-entry-test-"));
  try {
    const names = ["old-reader", "new-reader"].map((chunk, i) => {
      const dist = join(root, String(i));
      const bundles = join(dist, "_expo/static/js/web");
      mkdirSync(bundles, { recursive: true });
      mkdirSync(join(dist, "nested"));
      const bytes = `load('/_expo/static/js/web/${chunk}.js')`;
      writeFileSync(join(bundles, "entry-same.js"), bytes);
      const html = '<script src="/_expo/static/js/web/entry-same.js"></script>';
      writeFileSync(join(dist, "index.html"), html);
      writeFileSync(join(dist, "nested/index.html"), html);
      const name = fingerprintWebEntry(dist);
      assert.deepEqual(readdirSync(bundles), [name]);
      assert.equal(readFileSync(join(bundles, name), "utf8"), bytes);
      for (const page of ["index.html", "nested/index.html"]) {
        assert.equal(readFileSync(join(dist, page), "utf8"), html.replace("entry-same.js", name));
      }
      assert.equal(fingerprintWebEntry(dist), name);
      return name;
    });
    assert.notEqual(names[0], names[1]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
