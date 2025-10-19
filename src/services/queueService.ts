import redis from '../config/redis';
import logger from '../utils/logger';
import { BackgroundWorker } from './backgroundWorker';

const QUEUE_NAME = 'anime_slugs_queue';

export class QueueService {
  // -- Add Slug To Queue --
  static async addSlug(slug: string): Promise<void> {
    try {
      await redis.lpush(QUEUE_NAME, slug);
      logger.info(`Added slug to queue: ${slug}`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          slug,
        },
        'Error adding slug to queue'
      );
      throw new Error('Failed to add slug to queue');
    }
  }

  // -- Add Slugs To Queue --
  static async addSlugs(slugs: string[]): Promise<void> {
    try {
      if (slugs.length === 0) {
        logger.info('No slugs to add to queue');
        return;
      }

      const pipeline = redis.pipeline();
      for (const slug of slugs) {
        pipeline.lpush(QUEUE_NAME, slug);
      }
      await pipeline.exec();

      logger.info(`Added ${slugs.length} slugs to queue`);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          slugsCount: slugs.length,
        },
        'Error adding slugs to queue'
      );
      throw new Error('Failed to add slugs to queue');
    }
  }

  // -- Get Next Slug --
  static async getNextSlug(): Promise<string | null> {
    try {
      const result = await redis.rpop(QUEUE_NAME);
      if (result) {
        logger.info(`Retrieved slug from queue: ${result}`);
      }
      return result;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error getting slug from queue'
      );
      return null;
    }
  }

  // -- Get Next Slugs --
  static async getNextSlugs(count: number): Promise<string[]> {
    try {
      const slugs: string[] = [];

      for (let i = 0; i < count && (await redis.llen(QUEUE_NAME)) > 0; i++) {
        const slug = await this.getNextSlug();
        if (slug) {
          slugs.push(slug);
        }
      }

      logger.info(`Retrieved ${slugs.length} slugs from queue`);
      return slugs;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          count,
        },
        'Error getting slugs from queue'
      );
      return [];
    }
  }

  // -- Get Queue Length --
  static async getQueueLength(): Promise<number> {
    try {
      const length = await redis.llen(QUEUE_NAME);
      return length;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error getting queue length'
      );
      return 0;
    }
  }

  // -- Clear Queue --
  static async clearQueue(): Promise<void> {
    try {
      await redis.del(QUEUE_NAME);
      logger.info('Cleared the queue');
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error clearing queue'
      );
      throw new Error('Failed to clear queue');
    }
  }
}

export class CronJobService {
  private static cronInterval: NodeJS.Timeout | null = null;

  // -- Start Cron Job --
  static startCronJob(): void {
    logger.info('Starting cron job for scraping slugs every 30 minutes...');

    this.runScrapingJob();

    this.cronInterval = setInterval(
      () => {
        this.runScrapingJob();
      },
      30 * 60 * 1000
    );
  }

  // -- Stop Cron Job --
  static stopCronJob(): void {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
      logger.info('Cron job stopped');
    }
  }

  // -- Run Scraping Job --
  private static async runScrapingJob(): Promise<void> {
    logger.info('Running scheduled scraping job...');

    try {
      await BackgroundWorker.populateQueueWithHomeSlugs();

      logger.info('Scheduled scraping job completed successfully');
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error in scheduled scraping job'
      );
    }
  }
}
