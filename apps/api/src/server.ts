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
        apiAuthenticationMode: config.apiAuthenticationMode,
        configuredApiClientCount: config.apiClients.length,
        trustProxy: config.trustProxy,
        rateLimitingEnabled: config.rateLimitingEnabled,
        corsEnabled: config.corsEnabled,
        gatewaySharedSecretConfigured: Boolean(config.gatewaySharedSecret),
        enableMockOpenAi: config.enableMockOpenAi,
      },
      'API started',
    );
  })
  .catch((error) => {
    app.log.error(error, 'API failed to start');
    process.exitCode = 1;
  });
