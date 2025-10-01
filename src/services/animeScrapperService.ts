import logger from '../utils/logger';

interface ScrapeResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

class AnimeScrapperService {
  async scrapeAnimeData(url: string): Promise<ScrapeResult> {
    try {
      logger.info(`Starting to scrape anime data from ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const html = await response.text();

      logger.info(`Successfully scraped data from ${url}`);

      return {
        success: true,
        data: { url, html: html.substring(0, 100) + '...' },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        {
          error: errorMessage,
          url,
        },
        'Error occurred while scraping'
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export default new AnimeScrapperService();
