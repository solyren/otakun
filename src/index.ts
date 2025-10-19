import { Elysia } from 'elysia';

import { SERVER_PORT } from './config/app';
import { AppController } from './controllers/AppController';
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import responseTime from './middleware/responseTime';
import apiRoutes from './routes';
import { BackgroundWorker } from './services/backgroundWorker';
import { CronJobService } from './services/queueService';
import logger from './utils/logger';

BackgroundWorker.start().catch((error) => {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    'Error starting background worker'
  );
});

CronJobService.startCronJob();

new Elysia()

  .use(errorHandler)

  .use(responseTime)

  .use(requestLogger)
  .get('/', () => {
    return AppController.getRoot();
  })
  .use(apiRoutes)
  .listen({ port: SERVER_PORT, hostname: '0.0.0.0' });

logger.info(`Server is running on port ${SERVER_PORT}`);

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await BackgroundWorker.stop();
  CronJobService.stopCronJob();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await BackgroundWorker.stop();
  CronJobService.stopCronJob();
  process.exit(0);
});
