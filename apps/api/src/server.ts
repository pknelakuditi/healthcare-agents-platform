import { buildApp } from './app.js';
import { getRuntimeConfig } from '../../../packages/config/src/index.js';

const config = getRuntimeConfig();
const app = buildApp(config);

app
  .listen({
    port: config.apiPort,
    host: '0.0.0.0',
  })
  .catch((error) => {
    app.log.error(error, 'API failed to start');
    process.exitCode = 1;
  });
