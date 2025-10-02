import logger from '../utils/logger';

export class AppController {
  static async getRoot(): Promise<{ message: string }> {
    logger.info('API root accessed');
    return { message: 'Welcome to Anime Scrapper API!' };
  }
}
