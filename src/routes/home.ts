import { Elysia } from 'elysia';

import { HomeController } from '../controllers/HomeController';

const homeRoute = new Elysia({ prefix: '/home' });

homeRoute.get('/', async () => {
  return await HomeController.getHomeData();
});

export default homeRoute;
