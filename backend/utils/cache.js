/**
 * Simple in-memory cache utility for RestoLedger POS.
 * Used for caching settings and public menu data to reduce DB load.
 */

class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Set a value in the cache.
     * @param {string} key - Cache key.
     * @param {any} value - Value to store.
     * @param {number} ttlSeconds - Time to live in seconds. Default 60s.
     */
    set(key, value, ttlSeconds = 60) {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiresAt });
    }

    /**
     * Get a value from the cache. Returns null if missing or expired.
     * @param {string} key - Cache key.
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Delete a specific key.
     * @param {string} key - Cache key.
     */
    del(key) {
        this.cache.delete(key);
    }

    /**
     * Delete all keys starting with a prefix.
     * Useful for clearing all cache for a specific shop.
     * @param {string} prefix - Key prefix.
     */
    delByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache.
     */
    clear() {
        this.cache.clear();
    }
}

const cache = new SimpleCache();
module.exports = cache;
