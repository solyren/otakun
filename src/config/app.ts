import { config } from 'dotenv';

config();

const SERVER_PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SAMEHADAKU_BASE_URL =
  process.env.SAMEHADAKU_BASE_URL || 'https://v1.samehadaku.how';

export { LOG_LEVEL, NODE_ENV, SAMEHADAKU_BASE_URL, SERVER_PORT };
