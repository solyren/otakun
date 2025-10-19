import redis from '../config/redis';
import type { Anime, SamehadakuHomeItem } from '../types/anime';
import logger from '../utils/logger';

export class CacheService {
  private static readonly TTL = 60 * 60 * 24;
  private static readonly SAMEHADAKU_CACHE_PREFIX = 'samehadaku:';
  private static readonly JIKAN_CACHE_PREFIX = 'jikan:';
  private static readonly INTEGRATION_CACHE_PREFIX = 'integration:';

  // -- Cache Samehadaku Data --
  static async cacheSamehadakuData(slug: string, data: unknown): Promise<void> {
    try {
      const key = `${this.SAMEHADAKU_CACHE_PREFIX}${slug}`;
      await redis.setex(key, this.TTL, JSON.stringify(data));
      logger.info(`Cached Samehadaku data for slug: ${slug}`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          slug,
        },
        'Error caching Samehadaku data'
      );
      throw new Error('Failed to cache Samehadaku data');
    }
  }

  // -- Get Cached Samehadaku Data --
  static async getCachedSamehadakuData(
    slug: string
  ): Promise<SamehadakuHomeItem[] | null> {
    try {
      const key = `${this.SAMEHADAKU_CACHE_PREFIX}${slug}`;
      const cachedData = await redis.get(key);

      if (cachedData) {
        let parsedData;
        if (typeof cachedData === 'string') {
          try {
            parsedData = JSON.parse(cachedData);
          } catch (parseError) {
            logger.error(
              {
                error:
                  parseError instanceof Error
                    ? parseError.message
                    : String(parseError),
                stack:
                  parseError instanceof Error ? parseError.stack : undefined,
                slug,
                cachedData,
              },
              'Error parsing cached Samehadaku data'
            );
            return null;
          }
        } else {
          parsedData = cachedData;
        }

        logger.info(`Retrieved cached Samehadaku data for slug: ${slug}`);
        return parsedData;
      }

      logger.info(`No cached Samehadaku data for slug: ${slug}`);
      return null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          slug,
        },
        'Error retrieving cached Samehadaku data'
      );
      return null;
    }
  }

  // -- Cache Jikan Data --
  static async cacheJikanData(id: string, data: Anime): Promise<void> {
    try {
      const key = `${this.JIKAN_CACHE_PREFIX}${id}`;
      await redis.setex(key, this.TTL, JSON.stringify(data));
      logger.info(`Cached Jikan data for ID: ${id}`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          id,
        },
        'Error caching Jikan data'
      );
      throw new Error('Failed to cache Jikan data');
    }
  }

  // -- Get Cached Jikan Data --
  static async getCachedJikanData(id: string): Promise<Anime | null> {
    try {
      const key = `${this.JIKAN_CACHE_PREFIX}${id}`;
      const cachedData = await redis.get(key);

      if (cachedData) {
        let parsedData;
        if (typeof cachedData === 'string') {
          try {
            parsedData = JSON.parse(cachedData);
          } catch (parseError) {
            logger.error(
              {
                error:
                  parseError instanceof Error
                    ? parseError.message
                    : String(parseError),
                stack:
                  parseError instanceof Error ? parseError.stack : undefined,
                id,
                cachedData,
              },
              'Error parsing cached Jikan data'
            );
            return null;
          }
        } else {
          parsedData = cachedData;
        }

        logger.info(`Retrieved cached Jikan data for ID: ${id}`);
        return parsedData;
      }

      logger.info(`No cached Jikan data for ID: ${id}`);
      return null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          id,
        },
        'Error retrieving cached Jikan data'
      );
      return null;
    }
  }

  // -- Cache Integration Data --
  static async cacheIntegrationData(
    samehadakuSlug: string,
    data: Anime
  ): Promise<void> {
    try {
      const key = `${this.INTEGRATION_CACHE_PREFIX}${samehadakuSlug}`;
      await redis.setex(key, this.TTL, JSON.stringify(data));
      logger.info(
        `Cached integration data for Samehadaku slug: ${samehadakuSlug}`
      );
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          samehadakuSlug,
        },
        'Error caching integration data'
      );
      throw new Error('Failed to cache integration data');
    }
  }

  // -- Get Cached Integration Data --
  static async getCachedIntegrationData(
    samehadakuSlug: string
  ): Promise<Anime | null> {
    try {
      const key = `${this.INTEGRATION_CACHE_PREFIX}${samehadakuSlug}`;
      const cachedData = await redis.get(key);

      if (cachedData) {
        let parsedData;
        if (typeof cachedData === 'string') {
          try {
            parsedData = JSON.parse(cachedData);
          } catch (parseError) {
            logger.error(
              {
                error:
                  parseError instanceof Error
                    ? parseError.message
                    : String(parseError),
                stack:
                  parseError instanceof Error ? parseError.stack : undefined,
                samehadakuSlug,
                cachedData,
              },
              'Error parsing cached integration data'
            );
            return null;
          }
        } else {
          parsedData = cachedData;
        }

        logger.info(
          `Retrieved cached integration data for Samehadaku slug: ${samehadakuSlug}`
        );
        return parsedData;
      }

      logger.info(
        `No cached integration data for Samehadaku slug: ${samehadakuSlug}`
      );
      return null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          samehadakuSlug,
        },
        'Error retrieving cached integration data'
      );
      return null;
    }
  }

  // -- Cache Home Data --
  static async cacheHomeData(data: Anime[]): Promise<void> {
    try {
      await redis.setex('home_data', this.TTL, JSON.stringify(data));
      logger.info(`Cached home data with ${data.length} items`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          dataCount: data.length,
        },
        'Error caching home data'
      );
      throw new Error('Failed to cache home data');
    }
  }

  // -- Get Cached Home Data --
  static async getCachedHomeData(): Promise<Anime[] | null> {
    try {
      const cachedData = await redis.get('home_data');

      if (cachedData) {
        let parsedData;
        if (typeof cachedData === 'string') {
          try {
            parsedData = JSON.parse(cachedData);
          } catch (parseError) {
            logger.error(
              {
                error:
                  parseError instanceof Error
                    ? parseError.message
                    : String(parseError),
                stack:
                  parseError instanceof Error ? parseError.stack : undefined,
                cachedData,
              },
              'Error parsing cached home data'
            );
            return null;
          }
        } else {
          parsedData = cachedData;
        }

        logger.info('Retrieved cached home data');
        return parsedData;
      }

      logger.info('No cached home data');
      return null;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error retrieving cached home data'
      );
      return null;
    }
  }

  // -- Invalidate Cache --
  static async invalidateCache(key: string): Promise<void> {
    try {
      if (!key) {
        logger.warn('Attempted to invalidate cache with null/undefined key');
        return;
      }

      const fullKey =
        key.startsWith('samehadaku:') ||
        key.startsWith('jikan:') ||
        key.startsWith('integration:')
          ? key
          : `${this.INTEGRATION_CACHE_PREFIX}${key}`;

      await redis.del(fullKey);
      logger.info(`Invalidated cache for key: ${fullKey}`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          key,
        },
        'Error invalidating cache'
      );
      throw new Error('Failed to invalidate cache');
    }
  }

  // -- Clear All Cache --
  static async clearAllCache(): Promise<void> {
    try {
      const patterns = [
        `${this.SAMEHADAKU_CACHE_PREFIX}*`,
        `${this.JIKAN_CACHE_PREFIX}*`,
        `${this.INTEGRATION_CACHE_PREFIX}*`,
        'home_data',
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      logger.info('Cleared all cache');
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error clearing all cache'
      );
      throw new Error('Failed to clear all cache');
    }
  }
}
