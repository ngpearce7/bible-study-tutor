/** Serialize local edits while retaining compare-and-swap protection across devices. */
export function createReaderSyncQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  let lastRevision = 0;
  let failed = false;
  return {
    save(baseRevision: number, commit: (revision: number) => Promise<unknown>) {
      const job = tail.then(async () => {
        if (failed) throw new Error("Reader synchronization paused after a failed save");
        const expected = Math.max(baseRevision, lastRevision);
        await commit(expected);
        lastRevision = expected + 1;
      });
      tail = job.catch(() => { failed = true; });
      return job;
    }
  };
}
