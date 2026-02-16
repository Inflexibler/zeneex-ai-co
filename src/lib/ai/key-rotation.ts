import { logger } from "../utils/logger";

interface KeyPool {
  keys: string[];
  currentIndex: number;
  failures: Map<string, number>;
  lastUsed: Map<string, number>;
  cooldownUntil: Map<string, number>;
}

const COOLDOWN_PERIOD = 5 * 60 * 1000;
const MAX_FAILURES = 3;

const keyPools: Map<string, KeyPool> = new Map();

function getKeyPool(provider: string, keys: string[]): KeyPool {
  if (!keyPools.has(provider)) {
    keyPools.set(provider, {
      keys: [...keys],
      currentIndex: 0,
      failures: new Map(),
      lastUsed: new Map(),
      cooldownUntil: new Map(),
    });
  }
  return keyPools.get(provider)!;
}

export const keyRotation = {
  getKey(provider: string, keys: string[]): string {
    const pool = getKeyPool(provider, keys);

    if (pool.keys.length === 0) {
      throw new Error(`No API keys available for provider: ${provider}`);
    }

    const now = Date.now();
    const availableKeys = pool.keys.filter((key) => {
      const cooldownEnd = pool.cooldownUntil.get(key) || 0;
      return cooldownEnd <= now;
    });

    if (availableKeys.length === 0) {
      logger.warn("All keys are in cooldown, waiting for availability", { provider });
      const earliestRecovery = Math.min(...pool.cooldownUntil.values());
      const waitTime = Math.ceil((earliestRecovery - now) / 1000);
      throw new Error(
        `All ${provider} API keys are in cooldown. Please try again in ${waitTime} seconds.`
      );
    }

    let selectedIndex = pool.currentIndex;
    let selectedKey = pool.keys[selectedIndex];

    for (let i = 0; i < availableKeys.length; i++) {
      const key = availableKeys[i];
      const failures = pool.failures.get(key) || 0;
      const keyFailures = pool.failures.get(selectedKey) || 0;

      if (failures < keyFailures) {
        selectedKey = key;
        selectedIndex = pool.keys.indexOf(key);
      }
    }

    pool.currentIndex = (selectedIndex + 1) % pool.keys.length;
    pool.lastUsed.set(selectedKey, now);

    logger.debug("API key selected", {
      provider,
      keyIndex: pool.keys.indexOf(selectedKey),
      failures: pool.failures.get(selectedKey) || 0,
    });

    return selectedKey;
  },

  recordSuccess(provider: string): void {
    const pool = keyPools.get(provider);
    if (!pool) return;

    for (const [key, count] of pool.failures.entries()) {
      if (count > 0) {
        pool.failures.set(key, count - 1);
      }
    }

    logger.debug("API key success recorded", { provider });
  },

  recordFailure(provider: string): void {
    const pool = keyPools.get(provider);
    if (!pool) return;

    const lastUsedKey = Array.from(pool.lastUsed.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (!lastUsedKey) {
      logger.warn("No recently used key found for failure recording", { provider });
      return;
    }

    const currentFailures = pool.failures.get(lastUsedKey) || 0;
    pool.failures.set(lastUsedKey, currentFailures + 1);

    if (currentFailures + 1 >= MAX_FAILURES) {
      const cooldownEnd = Date.now() + COOLDOWN_PERIOD;
      pool.cooldownUntil.set(lastUsedKey, cooldownEnd);

      logger.warn("API key placed in cooldown", {
        provider,
        failures: currentFailures + 1,
        cooldownUntil: new Date(cooldownEnd).toISOString(),
      });
    }

    logger.debug("API key failure recorded", {
      provider,
      key: lastUsedKey.substring(0, 8) + "...",
      failures: currentFailures + 1,
    });
  },

  getKeyStatus(provider: string): {
    totalKeys: number;
    availableKeys: number;
    cooldownKeys: number;
    failures: Record<string, number>;
  } {
    const pool = keyPools.get(provider);
    if (!pool) {
      return {
        totalKeys: 0,
        availableKeys: 0,
        cooldownKeys: 0,
        failures: {},
      };
    }

    const now = Date.now();
    let availableKeys = 0;
    let cooldownKeys = 0;

    for (const key of pool.keys) {
      const cooldownEnd = pool.cooldownUntil.get(key) || 0;
      if (cooldownEnd <= now) {
        availableKeys++;
      } else {
        cooldownKeys++;
      }
    }

    const failures: Record<string, number> = {};
    for (const [key, count] of pool.failures.entries()) {
      failures[key.substring(0, 8) + "..."] = count;
    }

    return {
      totalKeys: pool.keys.length,
      availableKeys,
      cooldownKeys,
      failures,
    };
  },

  resetKey(provider: string, key: string): void {
    const pool = keyPools.get(provider);
    if (!pool) return;

    pool.failures.delete(key);
    pool.cooldownUntil.delete(key);

    logger.info("API key reset", { provider, key: key.substring(0, 8) + "..." });
  },

  resetAllKeys(provider: string): void {
    const pool = keyPools.get(provider);
    if (!pool) return;

    pool.failures.clear();
    pool.cooldownUntil.clear();
    pool.currentIndex = 0;

    logger.info("All API keys reset", { provider });
  },

  getHealth(provider: string): {
    healthy: boolean;
    availableKeys: number;
    totalKeys: number;
    message: string;
  } {
    const status = this.getKeyStatus(provider);

    const healthy =
      status.totalKeys > 0 && status.availableKeys >= Math.ceil(status.totalKeys / 2);

    let message = "";
    if (status.totalKeys === 0) {
      message = "No API keys configured";
    } else if (status.availableKeys === 0) {
      message = "All keys are in cooldown";
    } else if (status.availableKeys < status.totalKeys) {
      message = `${status.cooldownKeys} key(s) in cooldown`;
    } else {
      message = "All keys operational";
    }

    return {
      healthy,
      availableKeys: status.availableKeys,
      totalKeys: status.totalKeys,
      message,
    };
  },
};
