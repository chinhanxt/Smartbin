import { createDefaultSeed, DEFAULT_REPOSITORY_VERSION } from './mockSeed.js';

export const REPOSITORY_STORAGE_KEY = 'smartbin:bulky:v1:repository';

export const getUserCacheKey = (userId) => `smartbin:bulky:v1:cache:${userId}`;
export const getUserOfflineDraftsKey = (userId) => `smartbin:bulky:v1:offline-drafts:${userId}`;

const clone = (value) => {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fallback
    }
  }
  return JSON.parse(JSON.stringify(value));
};

export function createMockStorage({
  storage = typeof window !== 'undefined' ? window?.localStorage : null,
} = {}) {
  const fallbackStore = {};
  const backing = storage || {
    getItem: (key) => (key in fallbackStore ? fallbackStore[key] : null),
    setItem: (key, value) => {
      fallbackStore[key] = String(value);
    },
    removeItem: (key) => {
      delete fallbackStore[key];
    },
    clear: () => {
      for (const k of Object.keys(fallbackStore)) delete fallbackStore[k];
    },
  };

  const getRepository = () => {
    try {
      const raw = backing.getItem(REPOSITORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === DEFAULT_REPOSITORY_VERSION) {
          return clone(parsed);
        }
      }
    } catch {
      // json parse error or invalid schema -> reseed
    }
    const seed = createDefaultSeed();
    backing.setItem(REPOSITORY_STORAGE_KEY, JSON.stringify(seed));
    return clone(seed);
  };

  const saveRepository = (repo) => {
    const data = clone(repo);
    data.version = DEFAULT_REPOSITORY_VERSION;
    backing.setItem(REPOSITORY_STORAGE_KEY, JSON.stringify(data));
    return clone(data);
  };

  const updateRepository = (updater) => {
    const current = getRepository();
    updater(current);
    return saveRepository(current);
  };

  const clearUserSession = (userId) => {
    if (!userId) return;
    backing.removeItem(getUserCacheKey(userId));
    backing.removeItem(getUserOfflineDraftsKey(userId));
  };

  const resetFixture = () => {
    const seed = createDefaultSeed();
    backing.setItem(REPOSITORY_STORAGE_KEY, JSON.stringify(seed));
    return clone(seed);
  };

  // Ensure repository exists
  getRepository();

  return {
    getRepository,
    saveRepository,
    updateRepository,
    clearUserSession,
    resetFixture,
    backing,
  };
}
