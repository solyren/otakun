import logger from '../utils/logger';
import { CacheService } from './cacheService';
import { HomeCacheService } from './homeCacheService';
import { ProcessingService } from './processingService';
import { QueueService } from './queueService';
import { scrapeSamehadakuSlugs } from './samehadakuScraperService';

export class BackgroundWorker {
  private static isRunning = false;
  private static workerInterval: NodeJS.Timeout | null = null;

  static cacheSamehadakuData = CacheService.cacheSamehadakuData;
  static getCachedSamehadakuData = CacheService.getCachedSamehadakuData;
  static cacheJikanData = CacheService.cacheJikanData;
  static getCachedJikanData = CacheService.getCachedJikanData;
  static cacheIntegrationData = CacheService.cacheIntegrationData;
  static getCachedIntegrationData = CacheService.getCachedIntegrationData;
  static cacheHomeData = CacheService.cacheHomeData;
  static getCachedHomeData = CacheService.getCachedHomeData;
  static invalidateCache = CacheService.invalidateCache;
  static clearAllCache = CacheService.clearAllCache;

  static updateHomeCache = HomeCacheService.updateHomeCache;
  static addAnimeToHomeCache = HomeCacheService.addAnimeToHomeCache;
  static removeAnimeFromHomeCache = HomeCacheService.removeAnimeFromHomeCache;

  private static processQueue = ProcessingService.processQueue;
  static runFullSync = ProcessingService.runFullSync;

  /**\n   * Memulai background worker\n   */
  static async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Background worker is already running');
      return;
    }

    logger.info('Starting background worker...');
    this.isRunning = true;

    this.workerInterval = setInterval(async () => {
      await this.processQueue();

      await new Promise((resolve) => setTimeout(resolve, 300));
    }, 5000);

    await this.populateQueueWithHomeSlugs();

    logger.info('Background worker started successfully');
  }

  /**\n   * Menghentikan background worker\n   */
  static async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Background worker is not running');
      return;
    }

    logger.info('Stopping background worker...');

    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }

    this.isRunning = false;
    logger.info('Background worker stopped successfully');
  }

  /**\n   * Populasi queue dengan slug dari halaman beranda\n   */
  private static async populateQueueWithHomeSlugs(): Promise<void> {
    try {
      logger.info('Populating queue with home page slugs...');
      const slugs = await scrapeSamehadakuSlugs(2);

      if (slugs.length > 0) {
        await QueueService.clearQueue();

        await QueueService.addSlugs(slugs);

        logger.info(`Added ${slugs.length} slugs to queue from home page`);
      } else {
        logger.warn('No slugs found from home page');
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error populating queue with home page slugs'
      );
    }
  }
}
