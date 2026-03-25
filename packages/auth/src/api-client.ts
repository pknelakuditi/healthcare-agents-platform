import { timingSafeEqual } from 'node:crypto';
import type { RuntimeConfig } from '../../config/src/index.js';

export class ApiAuthenticationRequiredError extends Error {
  constructor() {
    super('API authentication is required.');
    this.name = 'ApiAuthenticationRequiredError';
  }
}

export class ApiAuthenticationError extends Error {
  constructor(message = 'API authentication failed.') {
    super(message);
    this.name = 'ApiAuthenticationError';
  }
}

export type AuthenticatedApiClient = {
  clientId: string;
};

function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token.trim();
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function authenticateApiClient(
  headers: Record<string, string | string[] | undefined>,
  config: RuntimeConfig,
): AuthenticatedApiClient | null {
  if (!config.requireApiAuthentication) {
    return null;
  }

  const clientIdHeader = headers['x-client-id'];
  const apiKeyHeader = headers['x-api-key'];
  const authorizationHeader = headers.authorization;

  const clientId = Array.isArray(clientIdHeader) ? clientIdHeader[0] : clientIdHeader;
  const apiKeyFromHeader = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
  const bearerToken = Array.isArray(authorizationHeader)
    ? extractBearerToken(authorizationHeader[0])
    : extractBearerToken(authorizationHeader);
  const apiKey = apiKeyFromHeader ?? bearerToken;

  if (!clientId || !apiKey) {
    throw new ApiAuthenticationRequiredError();
  }

  const credential = config.apiClients.find((item) => item.clientId === clientId);
  if (!credential || !constantTimeEquals(apiKey, credential.apiKey)) {
    throw new ApiAuthenticationError();
  }

  return { clientId };
}
