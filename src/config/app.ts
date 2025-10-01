import { config } from 'dotenv';

config();

const SERVER_PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export { LOG_LEVEL, NODE_ENV, SERVER_PORT };
