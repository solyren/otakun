import redis from '../config/redis';
import type { Anime } from '../types/anime';
import logger from '../utils/logger';
import { CacheService } from './cacheService';

export class HomeCacheService {
  private static readonly INTEGRATION_CACHE_PREFIX = 'integration:';
  private static readonly HOME_CACHE_KEY = 'home_data';

  // -- Parse Cached Integration Data --
  private static parseCachedIntegrationData(
    cachedData: unknown,
    key: string
  ): Anime | null {
    if (typeof cachedData === 'string') {
      try {
        return JSON.parse(cachedData);
      } catch (parseError) {
        logger.error(
          {
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            stack: parseError instanceof Error ? parseError.stack : undefined,
            key,
            cachedData,
          },
          'Error parsing cached data'
        );
        return null;
      }
    } else {
      return cachedData;
    }
  }

  // -- Update Home Cache --
  static async updateHomeCache(): Promise<void> {
    try {
      const integrationKeys = await redis.keys(
        `${this.INTEGRATION_CACHE_PREFIX}*`
      );

      if (integrationKeys.length === 0) {
        logger.info('No integration cache entries found');

        await CacheService.cacheHomeData([]);
        return;
      }

      const allAnime = await this.getAllCachedIntegrationData(integrationKeys);

      await CacheService.cacheHomeData(allAnime);

      logger.info(`Updated home cache with ${allAnime.length} anime entries`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error updating home cache'
      );
    }
  }

  // -- Get All Cached Integration Data --
  private static async getAllCachedIntegrationData(
    keys: string[]
  ): Promise<Anime[]> {
    const allAnime: Anime[] = [];
    for (const key of keys) {
      if (!key) {
        logger.warn(
          'Skipping null or empty key during integration data retrieval'
        );
        continue;
      }
      const cachedData = await redis.get(key);
      if (!cachedData) continue;

      const animeData = this.parseCachedIntegrationData(cachedData, key);
      if (animeData) {
        allAnime.push(animeData);
      }
    }

    return allAnime;
  }

  // -- Add Anime to Home Cache --
  static async addAnimeToHomeCache(anime: Anime): Promise<void> {
    try {
      const existingHomeData = await CacheService.getCachedHomeData();
      let allAnime: Anime[] = [];

      if (existingHomeData) {
        allAnime = [...existingHomeData];
      }

      const existingIndex = allAnime.findIndex(
        (item) => item.id === anime.id || item.slug === anime.slug
      );
      if (existingIndex !== -1) {
        allAnime[existingIndex] = anime;
      } else {
        allAnime.push(anime);
      }

      await CacheService.cacheHomeData(allAnime);

      logger.info(
        `Added/updated anime to home cache: ${anime.title} (ID: ${anime.id})`
      );
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          anime,
        },
        'Error adding anime to home cache'
      );
    }
  }

  // -- Remove Anime from Home Cache --
  static async removeAnimeFromHomeCache(animeId: string): Promise<void> {
    try {
      const existingHomeData = await CacheService.getCachedHomeData();

      if (!existingHomeData || existingHomeData.length === 0) {
        logger.info('No existing home data to remove from');
        return;
      }

      const filteredAnime = existingHomeData.filter(
        (item) => item.id !== animeId
      );

      await CacheService.cacheHomeData(filteredAnime);

      logger.info(`Removed anime from home cache: ${animeId}`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          animeId,
        },
        'Error removing anime from home cache'
      );
    }
  }
}
