import { buildApp } from './app.js';
import { getRuntimeConfig } from '../../../packages/config/src/index.js';

const config = getRuntimeConfig();
const app = buildApp(config);

app
  .listen({
    port: config.apiPort,
    host: '0.0.0.0',
  })
  .then((address) => {
    app.log.info(
      {
        address,
        apiAuthenticationRequired: config.requireApiAuthentication,
        configuredApiClientCount: config.apiClients.length,
        trustProxy: config.trustProxy,
        enableMockOpenAi: config.enableMockOpenAi,
      },
      'API started',
    );
  })
  .catch((error) => {
    app.log.error(error, 'API failed to start');
    process.exitCode = 1;
  });
