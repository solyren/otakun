import { Elysia } from 'elysia';

import homeRoute from './home';

const apiRoutes = new Elysia({ prefix: '/api' }).use(homeRoute);

export default apiRoutes;
