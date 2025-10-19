import redis from '../config/redis';
import { BackgroundWorker } from '../services/backgroundWorker';
import type { Anime } from '../types/anime';
import logger from '../utils/logger';

const INTEGRATION_CACHE_PREFIX = 'integration:';

export class HomeController {
  static async getHomeData(): Promise<{
    success: boolean;
    data: Anime[];
    message?: string;
  }> {
    try {
      logger.info('Fetching home page content with integrated Jikan data');

      const animeList = await BackgroundWorker.getCachedHomeData();

      if (animeList && animeList.length > 0) {
        return {
          success: true,
          data: animeList,
          message: `Successfully retrieved ${animeList.length} anime items from cache`,
        };
      }

      logger.info(
        'No cached home data found, attempting to get available integrated data'
      );

      const allAnime = await this.getAnimeFromIntegrationCache();

      if (allAnime.length > 0) {
        logger.info(
          `Returning ${allAnime.length} anime items from integration cache`
        );
        return {
          success: true,
          data: allAnime,
          message: `Successfully retrieved ${allAnime.length} anime items from integration cache`,
        };
      }

      logger.info('No cached data found, starting background sync...');

      BackgroundWorker.runFullSync().catch((error) => {
        logger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Error running full sync in background'
        );
      });

      return {
        success: true,
        data: [],
        message: 'Data is being processed, please check back shortly',
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error in HomeController.getHomeData'
      );
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve data',
      };
    }
  }

  // -- Parse Cached Data --
  private static parseCachedData(
    cachedData: unknown
  ): Record<string, unknown> | unknown[] | null {
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
            cachedData,
          },
          'Error parsing cached integration data in HomeController'
        );
        return null;
      }
    } else {
      return cachedData;
    }
  }

  // -- Get Anime From Integration Cache --
  private static async getAnimeFromIntegrationCache(): Promise<Anime[]> {
    const integrationKeys = await redis.keys(`${INTEGRATION_CACHE_PREFIX}*`);

    if (integrationKeys.length === 0) {
      return [];
    }

    const allAnime: Anime[] = [];
    for (const key of integrationKeys) {
      if (!key) {
        logger.warn(
          'Skipping null or empty key during integration data retrieval in HomeController'
        );
        continue;
      }
      const cachedData = await redis.get(key);
      if (cachedData) {
        const animeData = this.parseCachedData(cachedData);
        if (animeData) {
          const filteredAnime = {
            id: animeData.id,
            title: animeData.title,
            slug: animeData.slug,
            status: animeData.status,
            rating: animeData.rating,
            cover: animeData.cover,
          };

          allAnime.push(filteredAnime);
        }
      }
    }

    return allAnime;
  }
}
