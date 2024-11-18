const dotEnv = require("dotenv");
const { EVENT_TYPES, RPC_TYPES } = require("./types");

dotEnv.config();

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_NAME: process.env.DATABASE_NAME,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_QUEUE: process.env.SERVICE_QUEUE,
  RPC_QUEUE: process.env.RPC_QUEUE,
  USERS_QUEUE: process.env.USERS_QUEUE,
  USERS_RPC: process.env.USERS_RPC,
  INTERVIEWS_QUEUE: process.env.INTERVIEWS_QUEUE,
  INTERVIEWS_RPC: process.env.INTERVIEWS_RPC,
  EVENT_TYPES,
  RPC_TYPES,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  IPAPI_API_URL: process.env.IPAPI_API_URL,
};
