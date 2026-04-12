/**
 * GeminiKeyManager — round-robin API key pool with automatic 429 rotation.
 *
 * Setup:
 *   GEMINI_API_KEY=AIza...        # primary key (required)
 *   GEMINI_API_KEY_2=AIza...      # optional — from a 2nd Google account
 *   GEMINI_API_KEY_3=AIza...      # optional — 3rd account
 *   GEMINI_API_KEY_4=AIza...      # optional — 4th account
 *
 * Each free key gives 1 500 req/day & 30 req/min.
 * With 4 keys → 6 000 req/day before any quota issue.
 */

interface KeyEntry {
  key: string;
  exhaustedUntil: number | null; // epoch ms when this key can be used again
  index: number;
}

class GeminiKeyManager {
  private keys: KeyEntry[];
  private current: number = 0;

  constructor() {
    const raw: string[] = [];

    const isRealKey = (k: string) =>
      k.length > 20 && !k.startsWith('PASTE') && !k.includes('_HERE');

    const primary = process.env.GEMINI_API_KEY?.trim();
    if (primary && isRealKey(primary)) raw.push(primary);

    for (let i = 2; i <= 9; i++) {
      const extra = process.env[`GEMINI_API_KEY_${i}`]?.trim();
      if (extra && isRealKey(extra)) raw.push(extra);
    }

    if (raw.length === 0) {
      throw new Error('No valid GEMINI_API_KEY found in environment. Set at least one real key.');
    }

    this.keys = raw.map((key, index) => ({ key, exhaustedUntil: null, index }));
    console.log(`🔑 Gemini key pool ready: ${this.keys.length} key(s) loaded`);
  }

  /**
   * Returns the next available API key using round-robin, skipping exhausted keys.
   * Throws if ALL keys are currently exhausted.
   */
  getKey(): string {
    const now = Date.now();

    // Recover keys whose cooldown has expired
    for (const entry of this.keys) {
      if (entry.exhaustedUntil !== null && now >= entry.exhaustedUntil) {
        console.log(`♻️  Gemini key #${entry.index + 1} quota window reset — reinstating`);
        entry.exhaustedUntil = null;
      }
    }

    // Rotate through all keys looking for one that isn't exhausted
    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      const idx = this.current % this.keys.length;
      this.current = (this.current + 1) % this.keys.length;
      const entry = this.keys[idx];
      if (!entry.exhaustedUntil) {
        return entry.key;
      }
    }

    // All keys exhausted — find the one that recovers soonest
    const soonest = this.keys.reduce((a, b) =>
      (a.exhaustedUntil ?? 0) < (b.exhaustedUntil ?? 0) ? a : b
    );
    const secondsLeft = Math.ceil(((soonest.exhaustedUntil ?? 0) - now) / 1000);
    throw new QuotaExhaustedError(`All Gemini API keys are at quota. Retry in ${secondsLeft}s.`, secondsLeft);
  }

  /**
   * Call this when a key returns a 429.  The key is cooled down for the
   * remainder of the current minute (RPM limit) – or 24h if it's a daily limit.
   */
  markExhausted(key: string, isDaily = false): void {
    const entry = this.keys.find(e => e.key === key);
    if (!entry) return;

    const cooldownMs = isDaily
      ? 24 * 60 * 60 * 1000   // 24h for daily quota
      : 65 * 1000;             // 65s for per-minute rate limit

    entry.exhaustedUntil = Date.now() + cooldownMs;
    console.warn(
      `⚠️  Gemini key #${entry.index + 1} marked exhausted for ${isDaily ? '24h' : '65s'}.` +
      ` ${this.availableCount()} / ${this.keys.length} key(s) still available.`
    );
  }

  availableCount(): number {
    const now = Date.now();
    return this.keys.filter(e => !e.exhaustedUntil || now >= e.exhaustedUntil).length;
  }

  totalCount(): number {
    return this.keys.length;
  }
}

export class QuotaExhaustedError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = 'QuotaExhaustedError';
    this.retryAfter = retryAfterSeconds;
  }
}

// Singleton — shared across all routes
export const keyManager = new GeminiKeyManager();
