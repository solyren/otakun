import { Elysia } from 'elysia';

import animeScrapperService from '../services/animeScrapperService';
import type { Anime } from '../types/anime';
import logger from '../utils/logger';

const animeListRoutes = new Elysia({ prefix: '/anime' })
  .get('/', () => {
    logger.info('Anime API root accessed');
    return { message: 'Welcome to Anime Scrapper API /api/anime endpoint!' };
  })
  .get('/scrape', async ({ query }) => {
    const url = query?.url as string;

    if (!url) {
      return { success: false, error: 'URL parameter is required' };
    }

    logger.info(`Scraping request for URL: ${url}`);
    const result = await animeScrapperService.scrapeAnimeData(url);

    return result;
  })
  .get('/list', async () => {
    logger.info('Anime list endpoint accessed');

    return {
      success: true,
      data: [] as Anime[],
      message: 'Anime list retrieved successfully',
    };
  })
  .get('/detail/:id', async ({ params }) => {
    const id = params.id;

    logger.info(`Anime detail endpoint accessed for ID: ${id}`);

    return {
      success: true,
      data: { id, title: `Anime ${id}`, slug: `anime-${id}` } as Anime,
      message: 'Anime detail retrieved successfully',
    };
  });

export default animeListRoutes;
