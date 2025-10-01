import { Elysia } from 'elysia';

import logger from '../utils/logger';

const errorHandler = new Elysia({ name: 'errorHandler' }).onError(
  ({ error, set }) => {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
      },
      'Unhandled error occurred'
    );

    set.status = 500;
    return {
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
);

export default errorHandler;
