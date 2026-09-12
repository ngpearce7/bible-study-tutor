import { expect, test } from "vitest";
import { createReaderSyncQueue } from "./readerSync";
test("local writes serialize with the preceding committed revision", async () => {
  const queue = createReaderSyncQueue();
  const revisions: number[] = [];
  await Promise.all([queue.save(4, async n => { revisions.push(n); }), queue.save(4, async n => { revisions.push(n); })]);
  expect(revisions).toEqual([4, 5]);
});
test("failure pauses subsequent writes until explicit reload", async () => {
  const queue = createReaderSyncQueue();
  await expect(queue.save(0, async () => { throw new Error("conflict"); })).rejects.toThrow();
  await expect(queue.save(1, async () => { throw new Error("must not run"); })).rejects.toThrow("paused");
});
