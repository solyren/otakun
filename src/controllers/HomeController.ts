import { scrapeSamehadakuHome } from '../services/samehadakuScraperService';
import type { SamehadakuHomeItem } from '../types/anime';
import logger from '../utils/logger';

export class HomeController {
  static async getHomeData(): Promise<{
    success: boolean;
    data: SamehadakuHomeItem[];
    message?: string;
  }> {
    try {
      logger.info('Fetching home page content from samehadaku');
      const animeList = await scrapeSamehadakuHome();

      return {
        success: true,
        data: animeList,
        message: `Successfully retrieved ${animeList.length} anime items from samehadaku`,
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
        message: 'Failed to retrieve data from samehadaku',
      };
    }
  }
}
