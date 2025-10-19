import logger from '../utils/logger';
import { CacheService } from './cacheService';
import { HomeCacheService } from './homeCacheService';
import { JikanIntegrationService } from './jikanIntegrationService';
import { QueueService } from './queueService';

export class ProcessingService {
  // -- Process Queue Item --
  static async processQueue(): Promise<void> {
    try {
      const slug = await QueueService.getNextSlug();

      if (!slug) {
        logger.info('Queue is empty, skipping processing');
        return;
      }

      logger.info(`Processing slug from queue: ${slug}`);

      const normalizedSlug = JikanIntegrationService.normalizeSlug(slug);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const jikanResults =
        await JikanIntegrationService.searchAnimeByNormalizedSlug(
          normalizedSlug
        );

      if (jikanResults.length > 0) {
        // Gunakan fungsi pencocokan berdasarkan slug untuk mendapatkan hasil yang lebih tepat
        const bestMatch = JikanIntegrationService.findMatchBySlug(normalizedSlug, jikanResults);

        if (bestMatch) {
          bestMatch.slug = slug;

          await CacheService.cacheIntegrationData(slug, bestMatch);

          logger.info(
            `Stored integration data for slug: ${slug} with Jikan ID: ${bestMatch.id}`
          );

          await HomeCacheService.addAnimeToHomeCache(bestMatch);
        } else {
          logger.info(`No matching anime found in Jikan for slug: ${slug}`);
        }
      } else {
        logger.info(`No matching anime found in Jikan for slug: ${slug}`);
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error processing queue item'
      );
    }
  }

  // -- Run Full Sync --
  static async runFullSync(): Promise<void> {
    logger.info('Starting full sync process...');

    const slugs = await import('./samehadakuScraperService').then((scraper) =>
      scraper.scrapeSamehadakuSlugs(2)
    );

    logger.info(`Found ${slugs.length} slugs to process`);

    await QueueService.clearQueue();
    await QueueService.addSlugs(slugs);

    const queueLength = await QueueService.getQueueLength();
    logger.info(`Processing ${queueLength} items in queue...`);

    let processedCount = 0;
    while ((await QueueService.getQueueLength()) > 0) {
      await this.processQueue();
      processedCount++;

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (processedCount % 10 === 0) {
        logger.info(`Processed ${processedCount}/${queueLength} items`);
      }
    }

    logger.info('Full sync process completed');
  }
}
