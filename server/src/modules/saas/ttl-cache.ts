/**
 * A small in-memory cache of recent answers, by key, for a fixed time.
 * Pure (the clock is passed in), so it is unit-tested on its own.
 *
 * - Only successes are kept: a failure is retried on the next request.
 * - Requests for a key already being loaded share that load.
 * - At most `maxEntries` keys; the least recently stored goes first.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; at: number }>();
  private readonly loading = new Map<string, Promise<{ value: T; at: number }>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** The cached value and when it was loaded, or a fresh load. */
  async get(key: string, load: () => Promise<T>): Promise<{ value: T; at: number }> {
    const hit = this.entries.get(key);
    if (hit && this.now() - hit.at < this.ttlMs) return hit;

    const pending = this.loading.get(key);
    if (pending) return pending;

    const request = load()
      .then((value) => {
        const entry = { value, at: this.now() };
        this.entries.delete(key);
        this.entries.set(key, entry);
        if (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
        return entry;
      })
      .finally(() => this.loading.delete(key));
    this.loading.set(key, request);
    return request;
  }
}
