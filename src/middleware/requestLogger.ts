import { Elysia } from 'elysia';

import logger from '../utils/logger';

interface RequestStore {
  startTime?: number;
}

const requestLogger = new Elysia({ name: 'requestLogger' })
  .onRequest(async ({ request, store }) => {
    const startTime = Date.now();

    (store as RequestStore).startTime = startTime;

    logger.info(
      {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers.get('user-agent') || 'unknown',
          'accept-encoding':
            request.headers.get('accept-encoding') || 'unknown',
        },
      },
      'Incoming request'
    );
  })
  .onAfterHandle(async ({ request, store }) => {
    const startTime = (store as RequestStore).startTime;
    const duration = Date.now() - (startTime || Date.now());

    logger.info(
      {
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
      },
      'Request completed'
    );
  });

export default requestLogger;
