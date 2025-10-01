import { Elysia } from 'elysia';

import { SERVER_PORT } from './config/app';
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import responseTime from './middleware/responseTime';
import apiRoutes from './routes';
import logger from './utils/logger';

new Elysia()

  .use(errorHandler)

  .use(responseTime)

  .use(requestLogger)
  .get('/', () => {
    logger.info('API root accessed');
    return { message: 'Welcome to Anime Scrapper API!' };
  })
  .use(apiRoutes)
  .listen({ port: SERVER_PORT, hostname: '0.0.0.0' });

logger.info(`Server is running on port ${SERVER_PORT}`);
