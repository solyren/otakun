import { Elysia } from 'elysia';

interface ResponseTimeStore {
  startTime?: number;
}

const responseTime = new Elysia({ name: 'responseTime' })
  .onRequest(({ store }) => {
    (store as ResponseTimeStore).startTime = Date.now();
  })
  .onAfterHandle(({ set, store }) => {
    const ms =
      Date.now() - ((store as ResponseTimeStore).startTime || Date.now());
    set.headers['X-Response-Time'] = `${ms}ms`;
  });

export default responseTime;
