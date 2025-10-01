import { Elysia } from 'elysia';

import animeRoutes from './anime';

const apiRoutes = new Elysia({ prefix: '/api' }).use(animeRoutes);

export default apiRoutes;
